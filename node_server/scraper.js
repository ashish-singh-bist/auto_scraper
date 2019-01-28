const puppeteer = require('puppeteer');
const path      = require('path');
const fileSystem= require('fs');
const mysql     = require('mysql')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const request = require("request-promise");
const config    = require(path.join(__dirname, 'config/config.js'));

var windowOpenWith  = 'http://' + config.root_ip + ':' + config.root_port ;
var parsing_mode  = process.argv[2];

var url_list_array = [];
//var source = '';
const thread_count = config.thread_count;
var host_slug = '';         //'www_youtube_com'
var source = '';            //'Youtube'
var site_config;
var puppeteer_enabled = 0;

if (parsing_mode == 'databasemode') {
    host_slug =  process.argv[3];
    user_id = process.argv[4];

    var data = [user_id, host_slug, 1];
    //var data = ['Blue Tomato'];
    var result = [];

    let connection    = mysql.createConnection({
                              host     : config.mysql_host,
                              user     : config.mysql_user,
                              password : config.mysql_password,
                              database : config.mysql_database,//config.mysql_database,
                              charset  : config.charset,
                          });
    //connect to database
    connection.connect(function(err) {
        if (err) {
            console.error('==Error db connecting: ' + err.stack);
            return;
        }

        //console.log('db connected as id ' + connection.threadId);
        connection.query("select * from tbl_url_lists Where user_id = ? and source = ? and is_active = ? and updated_at IS NULL and (actual_url IS NOT NULL or url IS NOT NULL) limit 10", data, function (err, results, fields){
        //connection.query("select * from ean_list Where source = ? and status_flag = 0 and updated_at IS NULL and url IS NOT NULL limit 10", data, function (err, results, fields){
            if (err)  console.log('==Error 1: ' + err);
            if(results.length){
                url_list_array = results;
            }
            if ( url_list_array.length > 0 )  {
                source = url_list_array[0].source;
            }
            connection.end();
            run();
        });
    });
}
else{
    host_slug   = source = process.argv[3];      //slug of host_base_url
    user_id = process.argv[5];              //user id of login user

    //read url list to parse, which user uploaded recently
    var url_arr_ = (fileSystem.readFileSync(path.join(__dirname, 'storage/product_url/'+host_slug+'_'+user_id+'_url_list_.txt'), 'utf8')).split('\r\n');
    for(var i = 0; i < url_arr_.length; i++){
        url_list_array.push({ 'actual_url':url_arr_[i] });
    }
    run();
}

/*_________________________Scraping with headless browser____________________________________*/
async function run() 
{
    // this is a loop to process all urls in chunk
    var process_index = 0;
    var all_url_count = url_list_array.length;

    //database connection setting
    let connection  = mysql.createConnection({
                          host     : config.mysql_host,
                          user     : config.mysql_user,
                          password : config.mysql_password,
                          database : config.mysql_database,
                          charset  : config.charset,
                      });

    //read config from db
    connection.query("select config from config_list where user_id= ? and config_name = ?", [user_id, host_slug], function (err, results, fields) {
        if (err){ 
            console.log('==Error 9: '+err);
        }else{
            if(results.length){
                site_config_json = JSON.parse(results[0].config);
                site_config = site_config_json.data;
                if(site_config_json.puppeteer_enabled != undefined && site_config_json.puppeteer_enabled == '1'){
                    puppeteer_enabled = 1;
                }
            }
        }
        connection.end();
        processChunk();
    });

    async function processChunk() {
        var url_list_chunk = [];
        if (all_url_count > process_index){
            url_list_chunk = url_list_array.slice(process_index, process_index + thread_count);
        }
        //if(url_list_chunk.length > 0){
            //site_config_json = JSON.parse(fileSystem.readFileSync(path.join(__dirname, 'storage/site_config/'+host_slug+'_'+user_id+'.json'), 'utf8'));
        //}
        (async () => {
            try {
                const pages = url_list_chunk.map(async (url_row_obj, i) => {
                    var url;
                    if(url_row_obj.actual_url != null){
                        url = url_row_obj.actual_url;
                    }else{
                        url = url_row_obj.url;
                    }

                    if(!puppeteer_enabled){
                        var options = {
                            headers: {
                                    'connection': 'keep-alive',
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
                                    //'Accept-Language': 'en-US,en;q=0.5', 
                                },
                            encoding: null,
                            jar: true 
                        }

                        console.log("loading page: " + url);
                        options['url'] = url;
                        options['resolveWithFullResponse'] = true;
                        options['encoding'] = 'utf8';
                        var html ="";
                        try {
                            await request(options, function(err, response, body){ 
                                console.log('statusCode=========='+response.statusCode);
                                // fileSystem.writeFile('test_scrap.html', body , function (err) {
                                //     if (err) throw err;
                                //     console.log('HTML File Saved!!!!!');
                                // });
                                if ( response.statusCode === 200 ) {
                                    html = body;
                                    //f = response.request.uri.href.replace('https://', '').replace('http://','');
                                    url_row_obj.actual_url = response.request.uri.href;
                                }
                            });
                        }
                        catch(err) {
                            console.log('==Error 2: '+err.message);
                        }

                        if(html){
                            let scraped_data = await startHTMLParsing(site_config,html,puppeteer_enabled);
                            console.log(scraped_data);
                            if(JSON.stringify(scraped_data) != '{}') {
                                console.log("saving data....");
                                await saveParseData(scraped_data, url_row_obj);
                                
                            }else{
                                await increaseErrorCount(url_row_obj.id);
                            }
                        }else{
                            await increaseErrorCount(url_row_obj.id);
                        }
                    }else{
                        //get and parse html with puppeteer
                        //proxy setting
                        var args = []; 
                        if ( config.proxy_enable ){
                            if ( config.proxy_type === 'tor'){
                                args = ['--proxy-server='+config.proxy_url];
                            }
                            else if ( config.proxy_type === 'authenticated' ) {
                                args = ['--proxy-server='+config.proxy_url];
                            }
                        }

                        const browser = await puppeteer.launch({args: args});
                        //const browser = await puppeteer.launch({headless: false}); //for RTech* (if you want to view the scraping on browser)
                        //const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}); // for ovh

                        const page = await browser.newPage();

                        //proxy authentication
                        if ( config.proxy_enable && config.proxy_type === 'authenticated' ){
                                page.authenticate({
                                username: config.proxy_username,
                                password: config.proxy_password
                            });
                        }

                        await page.setUserAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko');

                        await page.setViewport({width:1366,height:768});
                        await page.setRequestInterception(true);

                        page.on('request', (req) => {
                            if(req.resourceType() === 'stylesheet' || req.resourceType() === 'font' || req.resourceType() === 'image'){
                                req.abort();
                            }
                            else {
                                req.continue();
                            }
                        });

                        console.log(`loading page: ${url}`);
                        await page.goto(url, {
                            waitUntil: 'networkidle0',
                            timeout: 120000,
                        });

                        ////////////////////////////////////////////////////////////////////////////////////////////////////////
                        // get details from html (parse html)

                        // await page.on('console', msg => {
                        //         console.log(msg);
                        //  });
                                                 
                        let scraped_data = await page.evaluate(startHTMLParsing,site_config,'',puppeteer_enabled);
                        //console.log(scraped_data);
                        if(JSON.stringify(scraped_data) != '{}') {
                            scraped_data.url = url.replace('https://', '').replace('http://','');
                            await saveParseData(scraped_data, url_row_obj);                            
                        }else{
                            await increaseErrorCount(url_row_obj.id);
                        }
                        ////////////////////////////////////////////////////////////////////////////////////////////////////////
                        await page.close();
                        await browser.close();
                        console.log(`page closed`);
                    }

                    //console.log(`closing page: ${url}`);
                    //await page.waitFor(5000); //wait if necessary
                    //console.log(`page closed`);
                    //await page.close();
                    //await browser.close();
                });

                await Promise.all(pages).then(() => {
                    //do anything which you want to execute at the end
                    //parsing done
                });
                process_index += url_list_chunk.length;
                if(process_index < all_url_count){
                    setTimeout(processChunk, 3000); //run next url block with 3 sec delay
                }
                else if(parsing_mode == 'databasemode'){
                    setTimeout(endParsing, 5000);
                }
            } catch (err) {
                //console error if any
                console.log('==Error 3: ' + err.message);
            }
        })();
    }

    async function endParsing() {
        console.log('Parsing completed');
        process.exit();
    }
}

async function startHTMLParsing(site_config,html,puppeteer_enabled) 
{   
    // fileSystem.writeFile(path.join(__dirname, 'storage/site_output/html_me.txt'), html, function (err) { if (err) throw err; });
    if(!puppeteer_enabled){
        try{
            var dom = new JSDOM(html);
            var temp_document = dom.window.document;
            return parseHtml(site_config,temp_document);
        }
        catch(err){
            console.log('==Error 4: '+err.message);
            return scraped_data;
        }
    }else{
        return parseHtml(site_config,document);
    }    

    async function parseHtml(site_config,document)
    {
        var scraped_data = {};
        // console.log( 'document - ',document  );

        for(var obj of site_config) {
            try{
                var propertyValue_ = '';
                var propertyName = obj.key.toLowerCase();
                // console.log( '<br>propertyName - ',propertyName );
                if ('code_to_inject' in obj){
                    var html = document.documentElement.innerHTML;
                    var jsResult_ = eval('try {' + obj.code_to_inject + '}catch(err) {err.message}');
                    if( jsResult_ ){
                        scraped_data[ propertyName ] = jsResult_ ;
                    }
                }
                else{
                    if('id' in obj.attributes){            /* finding element via `id` */
                        var candidateElement =  document.getElementById( obj.attributes['id'] );
                        if( candidateElement && candidateElement.tagName.toLowerCase() == obj.tag.toLowerCase()){
                            // console.log('key - ',obj.key);
                            propertyValue_ = mapConfigSelectElementMapping( candidateElement );
                        }
                    }
                    if ( propertyValue_ ){
                        scraped_data[ propertyName ] = propertyValue_ ;
                        continue;
                    }
                    else{
                        propertyValue_ = mapConfigSelectElementCheck( obj );
                        if ( propertyValue_ )
                        scraped_data[ propertyName ] = propertyValue_ ;
                    }
                }
            }
            catch(err){
                console.log('==Error 5: '+err.message);
            }
        }
        return scraped_data;

        function mapConfigSelectElementCheck( propertyObj ){
            var propertyValue_ = '';
            // case 1 query selector
            var condition_string = '';
            var candidateElementAttrs  = propertyObj.attributes;
            for( var attribute in  candidateElementAttrs ){
                if( candidateElementAttrs[attribute] !== '' )
                    condition_string += '[' + attribute+'="' + candidateElementAttrs[attribute] + '"]';
            }
            if( condition_string != '' ){
                var candidateElements  = document.querySelectorAll( propertyObj.tag + condition_string + '');
                var candidateParent    = returnParentElement( propertyObj );
                if( candidateElements.length >= 1 ){
                    for( var x = 0 ; x < candidateElements.length; x++ ){
                        if( candidateElements[x].parentElement === candidateParent  && candidateElements[x] != null ){
                            propertyValue_ = mapConfigSelectElementMapping( candidateElements[x] );
                            // console.log('propertyValue_ - ',propertyValue_);
                            break;
                        }
                    }
                }
            }

            // case 2 xpath of target element
            else if( propertyValue_ == '' ){
                candidateElement = document.evaluate( propertyObj.xpath, document, null, 9, null).singleNodeValue;
                if ( candidateElement ) {
                    var candidateElementAttr = getAttr( candidateElement );
                    var candidateElementParentAttr = getAttr( candidateElement.parentElement );
                    var ms = false, ms_candidateElementAttrClass = true, ms_candidateElementParentAttrId = true, ms_candidateElementParentAttrClass = true;

                    if ( propertyObj.tag.toLowerCase() == candidateElement.tagName.toLowerCase()  && propertyObj.parent_tag.toLowerCase() ==  candidateElement.parentElement.tagName.toLowerCase()) {
                        if ( propertyObj.xpath ==  getXPathAutoScraper( candidateElement ) && propertyObj.parent_xpath ==  getXPathAutoScraper( candidateElement.parentElement )){
                            ms = true; // matched status
                            if ( candidateElementAttr.class && propertyObj.attributes.class){
                                ms_candidateElementAttrClass = false;
                                ms_candidateElementAttrClass = (candidateElementAttr.class == propertyObj.attributes.class ) ? true : false ;
                            }
                            // parent 
                            if ( candidateElementParentAttr.id && propertyObj.parent_attributes.id){
                                ms_candidateElementParentAttrId = false;
                                ms_candidateElementParentAttrId = (candidateElementParentAttr.id == propertyObj.parent_attributes.id ) ? true : false ;
                            }
                            if ( candidateElementParentAttr.class && propertyObj.parent_attributes.class){
                                ms_candidateElementParentAttrClass = false;
                                ms_candidateElementParentAttrClass = (candidateElementParentAttr.class == propertyObj.parent_attributes.class ) ? true : false ;
                            }
                        }
                    }
                    if ( ms &&  ms_candidateElementAttrClass &&  ms_candidateElementParentAttrId && ms_candidateElementParentAttrClass){
                        propertyValue_ = mapConfigSelectElementMapping( candidateElement );
                    }
                }
            }
            return propertyValue_;
        }

        function mapConfigSelectElementMapping( candidateElement ){
            // var replace = '(.)+' + config.root_port + '\/';
            // var imgUrlRegExpObj = new RegExp(replace, "g");  // object of regular expression  "(.)+<port number>\\/"
            // var res_ = candidateElement.src? candidateElement.src.replace(imgUrlRegExpObj, ''): candidateElement.textContent? candidateElement.textContent.replace(/[\n\t\r]/g, '').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2').trim() : candidateElement.value.replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2')
            // console.log( res_ );
            if ( candidateElement.tagName.toLowerCase() === 'img' ){
               return candidateElement.getAttribute('src');
            }

            // else if( candidateElement === 'a' ){
            //    return element.getAttribute('href');
            // }

            else {
               return candidateElement.textContent.replace(/[\n\t\r]/g, '').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2').trim();
            }
        }

        /* to extract and create a list of the element's attributes */
        function getAttr(ele){
            let temp = {};
            let arr  = [];
            if( ele && ele.attributes ){
                let attrlist = ele.attributes;
                for(var i=0; i< attrlist.length; i++){
                    if(attrlist[i].name != 'href' && attrlist[i].name.match('ng-') == null && attrlist[i].name != 'labelkey' && attrlist[i].name != 'style' && (attrlist[i].value !== '' && attrlist[i].value !== ' '))
                        temp[attrlist[i].name] = attrlist[i].value.replace('option-selected', '').replace(/\s+$/, '');
                }
                return temp;
            }
            return temp;
        }
        /* to calculate xpath of a given element */
        function getXPathAutoScraper( element ) {
            var paths = [];
            try{
                for (; element && element.nodeType == 1; element = element.parentNode) {
                    var index = 0;
                    for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                        // Ignore document type declaration.
                        //if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                        if (sibling.nodeType == 10)
                            continue;
                        if (sibling.nodeName == element.nodeName)
                            ++index;
                    }
                    var tagName = element.nodeName.toLowerCase();
                    var pathIndex = (index ? "["+(index + 1) + "]" : "");
                    paths.splice(0, 0, tagName + pathIndex);
                }
                return paths.length ? "/" + paths.join("/"): null;
            }catch(err){
                console.log('==Error 7: '+err.message);
                return null;
            }
        }

        function returnParentElement( propertyObj ){
            var attributes = propertyObj.parent_attributes, xpath = propertyObj.parent_xpath, tag = propertyObj.parent_tag, parentElement;
            try{
                /* if parent has `id` */
                if(attributes['id']){
                    parentElement = document.getElementById(attributes['id']);
                    if(parentElement != null){
                        return parentElement;
                    }else{
                        //if an id is contains a dynamically generated entity
                        var temporary_id_container = attributes['id'];
                        var split_id = temporary_id_container.split(/([0-9]+)/g);
                        for(var x=0; x< split_id.length; x++){
                            var candidateParent = document.querySelector('*[id*="'+split_id[x]+'"]');
                            if(candidateParent)
                                return candidateParent
                        }
                    }
                }
                /* if parent has `class` */
                if(attributes['class']){
                    var candidateParents = document.getElementsByClassName(attributes['class']);
                    if(candidateParents.length > 0){
                        for(var i=0; i< candidateParents.length; i++){
                            var candidateParent = candidateParents[i];
                            var candidateParent_xpath = getXPathAutoScraper(candidateParent);
                            if(candidateParent_xpath == xpath){
                                parentElement = candidateParent;
                                return parentElement;
                            }
                        }
                    }    
                }
                /* if parent has attributes other than `id` and `class` */
                var condition_string = '';
                for(var attribute in  attributes){
                    condition_string += '['+attribute+'="'+attributes[attribute]+'"]';
                }
                if(condition_string != ''){
                    var candidateParent = document.querySelector(tag+condition_string);
                    if(candidateParent != null){
                        var candidateParent_xpath = getXPathAutoScraper(candidateParent);
                        if(candidateParent_xpath == xpath){
                            parentElement = candidateParent;
                            return parentElement;
                        }else{
                            var candidateParent_xpath2 = candidateParent_xpath.replace(/\[|\]|[1-9]+/g,'');
                            var xpath2  = xpath.replace(/\[|\]|[1-9]+/g,'');
                            if(candidateParent_xpath2 === xpath2){
                                parentElement = candidateParent;
                                return parentElement;
                            }
                        }
                    }
                    candidateParent = document.evaluate(xpath, document, null, 9, null).singleNodeValue;
                    if(candidateParent != null)
                        parentElement = candidateParent;
                }else{
                    var candidateParent = document.evaluate(xpath, document, null, 9, null).singleNodeValue;
                    if(candidateParent && candidateParent.tagName === tag.toUpperCase()){
                        return candidateParent;
                    }
                }
                return parentElement;
            }catch(err){
                console.log('==Error 6: '+err.message);
                return parentElement;
            }
        }
    }
}

async function saveParseData(scraped_data, url_row_obj)
{
    scraped_data.url = url_row_obj.actual_url;
    //save data to file
    var filename = host_slug + '_' + user_id;
    if (parsing_mode == 'normalmode') {
        var scrapedContentArray = [];
        try{
            if(fileSystem.existsSync(path.join(__dirname, 'storage/site_output/'+filename+'.json'))){
                scrapedContent = fileSystem.readFileSync(path.join(__dirname, 'storage/site_output/'+filename+'.json'), 'utf8');
                if(scrapedContent != ''){
                    scrapedContentArray = JSON.parse(scrapedContent);
                }
            }
            let temp_data = scraped_data;
            temp_data.url = temp_data.url.replace('https://', '').replace('http://','');
            scrapedContentArray.push(scraped_data);
            fileSystem.writeFile(path.join(__dirname, 'storage/site_output/'+filename+'.json'), JSON.stringify(scrapedContentArray), function (err) {
                if (err) throw err;
            });
        } catch(err) {
            console.log('==Error 8: '+err.message);
        }
    }

    //database connection setting
    let connection  = mysql.createConnection({
                          host     : config.mysql_host,
                          user     : config.mysql_user,
                          password : config.mysql_password,
                          database : config.mysql_database,
                          charset  : config.charset,
                      });
    //connect to database
    connection.connect(function(err) {
        if (err) {
            console.error('==Error db connecting: ' + err.stack);
            return;
        }

        //console.log('db connected as id ' + connection.threadId);
        //save data to database
        var data = {'user_id': user_id, 'source': source, 'data': JSON.stringify(scraped_data)};

        if(url_row_obj.ref_id != null){
            data.ref_id = url_row_obj.ref_id;
        }

        if(url_row_obj.id != null){
            data.url_list_id = url_row_obj.id;
        }
        connection.query("INSERT INTO scraped_data SET ?", data, function (err, results, fields) {
            //if (error) throw error
            if (err) console.log('==Error 9: '+err);
            console.log("Inserted Id: " + results.insertId);
            if( url_row_obj.id != null ){
                var d = new Date();
                var _data = { 'updated_at': d.getFullYear() +'-'+ (d.getMonth() + 1) +'-'+d.getDate() +' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds(), 'actual_url': scraped_data.url };
                //update status of url in database
                connection.query("update tbl_url_lists SET ? where id="+url_row_obj.id, _data, function (err, results, fields) {
                    //if (error) throw error;
                    if (err) console.log('==Error 10: '+err);
                    connection.end();
                    console.log('Url list updated for id:- ' + url_row_obj.id);
                });
            }else{
                connection.end();
            }
        });
    });
}

async function saveParseDataMV(scraped_data, url_row_obj)
{
    //database connection setting
    let connection  = mysql.createConnection({
                          host     : config.mysql_host,
                          user     : config.mysql_user,
                          password : config.mysql_password,
                          database : config.mysql_database,//config.mysql_database,
                          charset  : config.charset,
                      });
    //connect to database
    connection.connect(function(err) {
        if (err) {
            console.error('==Error db connecting: ' + err.stack);
            return;
        }

        var data = {};

        /////////////////////////////////////////////////////////////////////////////////
                                //manage data according mv
        /////////////////////////////////////////////////////////////////////////////////
        data.source = url_row_obj.source;
        data.ean = url_row_obj.ean;
        data.product_actual_url = url_row_obj.actual_url;
        if(scraped_data.images != null){
            data.images = JSON.stringify(scraped_data.images);
            delete scraped_data['images'];
        }        
        data.product_details = JSON.stringify(scraped_data);
        /////////////////////////////////////////////////////////////////////////////////

        ////////////////////////    
        if(url_row_obj.id != null){
            data.ean_ref_id = url_row_obj.id;
        }

        //if(url_list_id != null){
        //    data.url_list_id = url_row_obj.id;
        //}
        //save data to database
        connection.query("INSERT INTO ean_products_details SET ?", data, function (err, results, fields) {
            //if (error) throw error
            if (err) console.log('==Error 9: '+err);
            console.log("Inserted Id: " + results.insertId);
            if( url_row_obj.id != null ){
                var d = new Date();
                var _data = { 'updated_at': d.getFullYear() +'-'+ (d.getMonth() + 1) +'-'+d.getDate() +' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds(), 'final_url': url_row_obj.actual_url };
                //update status of url in database
                connection.query("update ean_list SET ? where id="+url_row_obj.id, _data, function (err, results, fields) {
                    //if (error) throw error;
                    if (err) console.log('==Error 10: '+err);
                    connection.end();
                    console.log('Url list updated for id:- ' + url_row_obj.id);
                });
            }else{
                connection.end();
            }
        });
    });
}

async function increaseErrorCount(url_list_id)
{
    //database connection setting
    let connection  = mysql.createConnection({
                          host     : config.mysql_host,
                          user     : config.mysql_user,
                          password : config.mysql_password,
                          database : config.mysql_database,//config.mysql_database,
                          charset  : config.charset,
                      });
    //connect to database
    connection.connect(function(err) {
        if (err) {
            console.error('==Error db connecting: ' + err.stack);
            return;
        }

        //console.log('db connected as id ' + connection.threadId);
        var d = new Date();
        var data = [d.getFullYear() +'-'+ (d.getMonth() + 1) +'-'+ d.getDate() +' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds(), url_list_id];

        if(url_list_id != null){
            connection.query("update tbl_url_lists set error_count = error_count + 1, updated_at=? where id=?", data, function (err, results, fields) {
            //connection.query("update ean_list set status_flag = 2, updated_at=? where id=?", data, function (err, results, fields) {
                //if (error) throw error
                if (err) console.log('==Error 11: '+err);
                console.log("Error count increased");
            });
        }
        connection.end();
    });
}