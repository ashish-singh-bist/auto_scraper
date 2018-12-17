const puppeteer = require('puppeteer');
const path      = require('path');
const fileSystem= require('fs');
const mysql     = require('mysql')
const DOMParser = require('xmldom').DOMParser;
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
//const https = require('https');
const request = require("request-promise");
const config    = require(path.join(__dirname, 'config/config.js'));

var windowOpenWith  = 'http://' + config.root_ip + ':' + config.root_port ;
var parsing_mode  = process.argv[2];

var url_list_array = [];
//var source = '';
const thread_count = config.thread_count;
var host_base_url = '';       //'https://www.youtube.com';
var host_slug = '';         //'www_youtube_com'
var site_config;

if ( parsing_mode == 'databasemode') {
    host_slug =  process.argv[3];
    user_id = process.argv[4];

    var data = [user_id, host_slug, 1];
    var result = [];

    var  getInformationFromDB = function(callback) {
        const connection    = mysql.createConnection({
                                  host     : config.mysql_host,
                                  user     : config.mysql_user,
                                  password : config.mysql_password,
                                  database : config.mysql_database
                              });
        //connect to database
        connection.connect();
        console.log("Scraper: Database connected");

        //execute query to select url to parse
        connection.query("select * from tbl_url_lists Where user_id = ? and source = ? and is_active = ? and updated_at IS NULL and actual_url IS NOT NULL limit 10", data, function (error, results, fields){
            if (error)  return callback(error);
            if(results.length){
                for(var i = 0; i < results.length; i++){
                    result.push({ 'act_url':results[i].actual_url, 'url_list_id':results[i].id, 'ref_id':results[i].ref_id, 'source':results[i].source});
                }
            }
            callback(null, result);
        });
        //connection.end();
        //run();
    };

    getInformationFromDB(function (error, result) {
        if (error) console.log("Database error!");
        else {
            url_list_array = result;
            if ( url_list_array.length > 0 )  {
                var url_ = url_list_array[0].act_url;
                host_slug = (url_.split('/'))[2].replace(/\./g,'_');

                var split_ar = url_.split('/');
                host_base_url = split_ar[0] + '//' + split_ar[2];
            }
            run();
        }
    });
}
else{
    host_slug   = process.argv[3];      //slug of host_base_url
    host_base_url = process.argv[4];    //base url of website
    user_id = process.argv[5];              //user id of login user     

    //read url list to parse, which user uploaded recently
    var url_arr_ = (fileSystem.readFileSync(path.join(__dirname, 'storage/product_url/'+host_slug+'_'+user_id+'_url_list_.txt'), 'utf8')).split('\r\n');
    for(var i = 0; i < url_arr_.length; i++){
        url_list_array.push({ 'act_url':url_arr_[i] });
    }
    run();
}

/*_________________________Scraping with headless browser____________________________________*/
async function run() 
{
    // this is a loop to process all urls in chunk
    var process_index = 0;
    var all_url_count = url_list_array.length;
    processChunk();
    async function processChunk() {
        var url_list_chunk = [];
        if (all_url_count > process_index){
            url_list_chunk = url_list_array.slice(process_index, process_index + thread_count);
        }
        if(url_list_chunk.length > 0){        
            site_config = JSON.parse(fileSystem.readFileSync(path.join(__dirname, 'storage/site_config/'+host_slug+'_'+user_id+'.json'), 'utf8')).data;
        }
        (async () => {
            try {
                const pages = url_list_chunk.map(async (url_obj, i) => {

                    //create url to process
                    let temp_url = windowOpenWith+url_obj.act_url.replace(host_base_url, '').replace(/\;/g,'');
                    var url = temp_url+'&config=true&host='+host_slug+'&uid='+user_id ;

                    //add some more parameter in url
                    var url_list_id = 0;
                    if ( parsing_mode == 'databasemode'){
                        url_list_id = url_obj.url_list_id;
                        url += '&url_list_id='+url_obj.url_list_id+'&ref_id='+url_obj.ref_id+'&source='+url_obj.source;
                    }

                    console.log(`loading page: ${url}`);
  
                    var options = {
                        headers: {
                                'connection': 'keep-alive',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
                                //'Accept-Language': 'en-US,en;q=0.5', 
                            },                        
                        encoding: null,
                        jar: true 
                    }

                    console.log("===================" + url_obj.act_url);
                    options['url'] = url_obj.act_url;
                    options['resolveWithFullResponse'] = true;
                    options['encoding'] = 'utf8';               
                    var html ="";
                    try {
                        await request(options, function(error, response, body){ 
                            console.log('statusCode=========='+response.statusCode);
                            // fileSystem.writeFile('test_scrap.html', body , function (err) {
                            //     if (err) throw err;
                            //     console.log('HTML File Saved!!!!!');
                            // });                            
                            if ( response.statusCode === 200 ) {
                                html = body;
                            }
                        });                        
                    }
                    catch(e) {                        
                        //console.log('error'+e.message);
                    }                    

                    if(html){
                        console.log("=======data get=======");
                        let scraped_data = await parsingScript(html, site_config);
                        console.log("=============================parse done============================:" + JSON.stringify(scraped_data));
                        //console.log(body);
                        // var parser = new DOMParser()
                        // var document = parser.parseFromString(body, "text/html");
                        // let scraped_data = await parsingScript(document, site_config);

                        if(JSON.stringify(scraped_data) != '{}') {
                            scraped_data.url = url_obj.act_url;
                            console.log("saving data...." + url_list_id);
                            await saveParseData(scraped_data, url_list_id);
                        }
                    }

                    console.log(`closing page: ${url}`);
                    //await page.waitFor(5000); //wait if necessary
                    console.log(`page closed`);
                    //await page.close();
                    //await browser.close();
                });

                await Promise.all(pages).then(() => {
                    //do anything which you want to execute at the end
                    //parsing done
                });
                process_index += url_list_chunk.length;
                if(process_index < all_url_count){
                    processChunk();
                }
            } catch (error) {
                //console error if any
                //console.log("error" + error);
            }
        })();
    }
}


async function parsingScript(html,site_config) 
{
    var scraped_data = {};

    try{
        //var parser = new DOMParser();

        //var document = parser.parseFromString(html, "text/html");

        var dom = new JSDOM(html);
        var document = dom.window.document;
        var doc = dom.window.document;
    }
    catch(err){
        console.log(err.message);
        return scraped_data;
    }


    for(var obj of site_config) {
        try{
            var element_attributes  = obj.attributes;
            var element_key = obj.key;
            var element_xpath   = obj.xpath;
            var element_tag = obj.tag;
            var element_index = obj.child_index;

            var parent_attributes   = obj.parent_attributes;
            var parent_xpath= obj.parent_xpath;
            var parent_tag  = obj.parent_tag;
            var element_flag = false;            

            if ('code_to_inject' in obj){
                var data_key = obj.key;
                var html = document.documentElement.innerHTML;
                scraped_data[data_key] = eval('try {' + obj.code_to_inject + '}catch(err) {err.message}');
            }
            /* finding element via `id` */
            else if('id' in element_attributes){
                var element = document.getElementById(element_attributes['id']);

                if(element){
                    element_flag = true;
                    scraped_data[element_key] = autoSelectElement(element, element_key, element_tag);
                    continue;
                }
            } 
            else{
                var condition_string = '';            
                for(var attribute in  element_attributes){                    
                    if(element_attributes[attribute] !== '')
                        condition_string += '['+attribute+'="'+element_attributes[attribute]+'"]';                        
                }
                if(condition_string != ''){
                    var candidate_elements  = doc.querySelectorAll(element_tag+condition_string+'');
                    console.log("candidate_elements***************"+condition_string);
                    var candidate_parent    = returnparent(parent_attributes, parent_xpath, parent_tag);                    
                    if(candidate_elements.length > 1){console.log('if_candidate_elements');
                        var candidate_parent = returnparent( parent_attributes, parent_xpath, parent_tag);
                        for(var x=0; x < candidate_elements.length; x++){                            
                            if(candidate_elements[x].parentElement === candidate_parent  && candidate_elements[x] != null){
                                element_flag = true;
                                //autoSelectElement(candidate_elements[x], element_key);
                                scraped_data[element_key] = autoSelectElement(candidate_elements[x], element_key, element_tag);
                                break;
                            }
                        }
                    }else{
                        candidate_element = document.evaluate(element_xpath, document, null, 9, null).singleNodeValue;                        
                        if(candidate_element != null){
                            element_flag = true;                            
                            //autoSelectElement(candidate_element, element_key);
                            scraped_data[element_key] = autoSelectElement(candidate_element, element_key, element_tag);                            
                        }
                    }
                }else{
                    var candidate_parent = returnparent( parent_attributes, parent_xpath, parent_tag);

                    //check if parent attributes in config is equal to candidate parents extracted attributes
                    if(candidate_parent && JSON.stringify(postGetAttr(candidate_parent)) === JSON.stringify(parent_attributes)){
                        var candidate_element = candidate_parent.childNodes[element_index];
                        
                        //autoSelectElement(candidate_element, element_key);
                        scraped_data[element_key] = autoSelectElement(candidate_element, element_key, element_tag);
                    }                    
                }
            }
            if(element_flag === false){
                var candidate_element = document.evaluate(element_xpath, document, null, 9, null).singleNodeValue;
                console.log("element_xpath===================="+element_xpath);
                console.log("==========candidate_element==========="+candidate_element);
                if(candidate_element != null){                    
                    var candidate_parent = returnparent(parent_attributes, parent_xpath, parent_tag);
                    if(candidate_parent && candidate_parent == candidate_element.parentElement){
                        element_flag = true;
                        
                        //autoSelectElement(candidate_element, element_key);
                        scraped_data[element_key] = autoSelectElement(candidate_element, element_key, element_tag);
                    }                    
                }
            }
        }
        catch(err){
            console.log(err.message);
        }
    }
    return scraped_data;


     /* select element */
    function autoSelectElement(ele, label, element_tag){
        var targetelement = ele;
        console.log('textContent================='+ele.textContent);        
        //var value = targetelement.src? targetelement.src.replace(re, ''): targetelement.textContent? targetelement.textContent.replace(/[\n\t\r]/g, '').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2').trim() : targetelement.value.replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2');        
        console.log('elementTag================'+element_tag);
        if ( element_tag === 'img' ){                                 
           return targetelement.getAttribute('src');
        }

        // else if( element_tag === 'a' ){
        //    return targetelement.getAttribute('href');
        // }

        else {
           return ele.textContent.replace(/[\n\t\r]/g, '').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2').trim();
        }
    }                

    async function returnparent(attributes, xpath, tag){
        var selected_parent;

        try{
            /* if parent has `id` */
            if(attributes['id']){
                
                selected_parent = document.getElementById(attributes['id']);
                if(selected_parent != null){
                    return selected_parent;
                }else{
                    //if an id is contains a dynamically generated entity
                    var temporary_id_container = attributes['id'];
                    var split_id = temporary_id_container.split(/([0-9]+)/g);
                    for(var x=0; x< split_id.length; x++){
                        var candidate_parent = doc.querySelector('*[id*="'+split_id[x]+'"]');
                        if(candidate_parent)
                            return candidate_parent
                    }
                }           
            }

            /* if parent has `class` */
            if(attributes['class']){
                
                var candidate_parents = document.getElementsByClassName(attributes['class']);
                if(candidate_parents.length > 0)
                    for(var i=0; i< candidate_parents.length; i++){
                        var candidate_parent = candidate_parents[i];
                        var candidate_parent_xpath = getXPathAutoScraper(candidate_parent);
                        if(candidate_parent_xpath == xpath){
                            selected_parent = candidate_parent;
                            return selected_parent;
                        }
                    }
            }

            /* if parent has attributes other than `id` and `class` */
            var condition_string = '';
            for(var attribute in  attributes){
                condition_string += '['+attribute+'="'+attributes[attribute]+'"]';
            }
            if(condition_string != ''){
                var candidate_parent = doc.querySelector(tag+condition_string);
                if(candidate_parent != null){
                    var candidate_parent_xpath = getXPathAutoScraper(candidate_parent);
                    if(candidate_parent_xpath == xpath){
                        selected_parent = candidate_parent;
                        return selected_parent;
                    }else{
                        var candidate_parent_xpath2 = candidate_parent_xpath.replace(/\[|\]|[1-9]+/g,'');
                        var xpath2  = xpath.replace(/\[|\]|[1-9]+/g,'');
                        if(candidate_parent_xpath2 === xpath2){
                            selected_parent = candidate_parent;
                            return selected_parent;
                        }
                    }
                }
                candidate_parent = document.evaluate(xpath, document, null, 9, null).singleNodeValue;
                if(candidate_parent != null)
                    selected_parent = candidate_parent;
            }else{
                var candidate_parent = document.evaluate(xpath, document, null, 9, null).singleNodeValue;
                if(candidate_parent && candidate_parent.tagName === tag.toUpperCase()){
                    return candidate_parent;
                }
            }
            return selected_parent;
        }catch(error){
            console.log(error.message);
            return selected_parent;
        }            
    }

    /* to calculate xpath of a given element */
    async function getXPathAutoScraper(element) {
        var paths = [];
        
        try{
            for (; element && element.nodeType == 1; element = element.parentNode) {
                var index = 0;
                for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                    // Ignore document type declaration.
                    if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                        continue;
                    if (sibling.nodeName == element.nodeName)
                        ++index;
                }
                var tagName = element.nodeName.toLowerCase();
                var pathIndex = (index ? "["+(index + 1) + "]" : "");
                paths.splice(0, 0, tagName + pathIndex);
            }
            return paths.length ? "/" + paths.join("/"): null;
        }catch(error){
            console.log(error.message);
            return null;
        }
    }
}

async function saveParseData(scraped_data, url_list_id)
{
    //save data to file
    var filename = host_slug + '_' + user_id;
    var scrapedContent = [];
    try{
        if(fileSystem.existsSync(path.join(__dirname, 'storage/site_output/'+filename+'.json'))){
            scrapedContent = fileSystem.readFileSync(path.join(__dirname, 'storage/site_output/'+filename+'.json'), 'utf8');
            if(scrapedContent != ''){
             scrapedContent = JSON.parse(scrapedContent);
            }
        }
        scrapedContent.push(scraped_data);
        fileSystem.writeFile(path.join(__dirname, 'storage/site_output/'+filename+'.json'), JSON.stringify(scrapedContent), function (err) {
            if (err) throw err;
        });
    } catch(e) {                        
        //console.log('error'+e.message);
    }     

    //database connection setting
    const connection  = mysql.createConnection({
                          host     : config.mysql_host,
                          user     : config.mysql_user,
                          password : config.mysql_password,
                          database : config.mysql_database,
                          charset : "utf8mb4_unicode_ci"
                      });
    //connect to database
    connection.connect();

    //save data to database
    var data = {'user_id': user_id, 'source': host_slug, 'data': JSON.stringify(scraped_data)};

    if(url_list_id > 0){
        data.url_list_id = url_list_id;
    }

    var query = connection.query("INSERT INTO scraped_data SET ?", data, function (error, results, fields) {
        //if (error) throw error
        if (error) console.log(error);
        if( url_list_id > 0 ){
            var d = new Date();
            var _data = { 'updated_at': d.getFullYear() +'-'+ d.getMonth()+'-'+d.getDate() +' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds() };
            //update status of url in database
            var query = connection.query("update tbl_url_lists SET ? where id="+url_list_id, _data, function (error, results, fields) {
                //if (error) throw error;
                connection.end();
                console.log("===============================parsed url_list_id" + url_list_id);
                if (error) console.log(error);
            });
        }
    });
}