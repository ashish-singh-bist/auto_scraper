const puppeteer = require('puppeteer');
const path      = require('path');
const fileSystem= require('fs');
const mysql     = require('mysql')
const config    = require(path.join(__dirname, 'config/config.js'));

var windowOpenWith  = 'http://' + config.root_ip + ':' + config.root_port ;
var parsing_mode  = process.argv[2];

var url_list_array = [];
var source = '';
const thread_count = config.thread_count;
var host_base_url = '';       //'https://www.youtube.com';
var host_slug = '';         //'www_youtube_com'
var site_config;

if ( parsing_mode == 'databasemode') {
    source =  process.argv[3];
    user_id = process.argv[4];

    var data = [user_id, source, 1];
    var result = [];

    var  getInformationFromDB = function() {
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
        connection.end();
        run();
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
        site_config = JSON.parse(fileSystem.readFileSync(path.join(__dirname, 'storage/site_config/'+host_slug+'_'+user_id+'.json'), 'utf8')).data;
        (async () => {
            try {
                const pages = url_list_chunk.map(async (url_obj, i) => {

                    //create url to process
                    let temp_url = windowOpenWith+url_obj.act_url.replace(host_base_url, '').replace(/\;/g,'');
                    var url = temp_url+'&config=true&host='+host_slug+'&uid='+user_id ;

                    //add some more parameter in url
                    url_list_id = 0;
                    if ( parsing_mode == 'databasemode'){
                        url_list_id = url_obj.url_list_id;
                        url += '&url_list_id='+url_obj.url_list_id+'&ref_id='+url_obj.ref_id+'&source='+url_obj.source;
                    }

                    const browser = await puppeteer.launch({headless: false});
                    //const browser = await puppeteer.launch({headless: false}); //for RTech* (if you want to view the scraping on browser)
                    //const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}); // for ovh

                    const page = await browser.newPage();

                    console.log(`loading page: ${url}`);
                    await page.goto(url, {
                        waitUntil: 'networkidle0',
                        timeout: 120000,
                    });

                    ////////////////////////////////////////////////////////////////////////////////////////////////////////
                    // get hotel details
                    let scraped_data = await page.evaluate(parsingScript,site_config);
                    //console.log(scraped_data);
                    if(JSON.stringify(scraped_data) != '{}') {
                        await saveParseData(scraped_data, url_list_id);
                    }
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////


                    //save html as pdf format for testing purpose
                    // console.log(`saving as pdf: ${url}`);
                    // await page.pdf({
                    //   path: `${i}.pdf`,
                    //   format: 'Letter',
                    //   printBackground: true,
                    // });

                    console.log(`closing page: ${url}`);
                    //await page.waitFor(5000); //wait if necessary
                    console.log(`page closed`);
                    await page.close();
                    await browser.close();
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
                console.log(error);
            }
        })();
    }
}


async function parsingScript(site_config) 
{
    var scraped_data = {};

    for(var obj of site_config){
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
                autoSelectElement(element, element_key, element_xpath, element_attributes);
                continue;
            }
        } else{
            var condition_string = '';
            for(var attribute in  element_attributes){
                if(element_attributes[attribute] !== '')
                    condition_string += '['+attribute+'="'+element_attributes[attribute]+'"]';
            }
            if(condition_string != ''){
                var candidate_elements  = document.querySelectorAll(element_tag+condition_string+'');
                var candidate_parent    = returnparent(parent_attributes, parent_xpath, parent_tag);
                if(candidate_elements.length === 1 && candidate_elements[0] != null){
                    element_flag = true;
                    
                    autoSelectElement(candidate_elements[0], element_key, element_xpath, element_attributes);
                }else if(candidate_elements.length > 1){
                    var candidate_parent = returnparent( parent_attributes, parent_xpath, parent_tag);
                    for(var x=0; x< candidate_elements.length; x++){
                        if(candidate_elements[x].parentElement === candidate_parent){
                            element_flag = true;
                            autoSelectElement(candidate_elements[x], element_key, element_xpath, element_attributes);
                            break;
                        }
                    }
                }else{
                    candidate_element = document.evaluate(element_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if(candidate_element != null){
                        element_flag = true;
                        autoSelectElement(candidate_element, element_key, element_xpath, element_attributes);
                    }
                }
            }else{
                var candidate_parent = returnparent( parent_attributes, parent_xpath, parent_tag);

                //check if parent attributes in config is equal to candidate parents extracted attributes
                if(candidate_parent && JSON.stringify(postGetAttr(candidate_parent)) === JSON.stringify(parent_attributes)){
                    var candidate_element = candidate_parent.childNodes[element_index];
                    
                    autoSelectElement(candidate_element, element_key, element_xpath, element_attributes);
                }
                
            }
        }

        if(element_flag === false){
            var candidate_element = document.evaluate(element_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if(candidate_element != null){
                var candidate_parent = returnparent(parent_attributes, parent_xpath, parent_tag);
                if(candidate_parent && candidate_parent == candidate_element.parentElement){
                    element_flag = true;
                    
                    autoSelectElement(candidate_element, element_key, element_xpath, element_attributes);
                }
                
            }
        }

    }
    return scraped_data;


     /* select element */
    async function autoSelectElement(ele, label, path, ele_attributes){
        var targetelement = ele;
        console.log('targetelement'+targetelement);
        var value = targetelement.src? targetelement.src.replace(re, ''): targetelement.textContent? targetelement.textContent.replace(/[\n\t\r]/g, '').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2').trim() : targetelement.value.replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2');
        targetelement.classList.add('option-selected');
        targetelement.classList.add('opt_selected_'+label);
        targetelement.setAttribute('labelkey', label);
        var display_selected_list = '<tr class="'+label+'_tr"><td><span class="closebtn" key="'+label+'" title="Remove this item">×</span></td><td>'+label+'</td><td>'+value+'</td></tr>';
        $('#selected_elements_list').append(display_selected_list);
        document.getElementById('panel').style.display='block';
        //var editmode = 'undefined';
        //if(editmode === 'undefined'){
            autoPostElement(label, targetelement, path);
        //}
    }

    /* extract selected element's properties */
    async function autoPostElement(label, targetelement, path){
        
        //for cases like one in `https://www.airbnb.co.in/rooms/20814508` where the <div> contains the image url in its `style` property
        let image   = (window.getComputedStyle(targetelement).backgroundImage);
        image       = image.substr(5, image.length-7);

        let replace = '(.)+'+config.root_port+'\/';     
        let re      = new RegExp(replace, "g");

        if(image.length)
            scraped_data[label] = image;
        else
            scraped_data[label] = targetelement.src? targetelement.src.replace(re, ''): targetelement.textContent? targetelement.textContent.replace(/[\n\t\r]/g, '').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2').trim() : targetelement.value.replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2');

        console.log(label, scraped_data[label])
    }                    

    async function returnparent(attributes, xpath, tag){
        var selected_parent;

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
                    var candidate_parent = document.querySelector('*[id*="'+split_id[x]+'"]');
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
            var candidate_parent = document.querySelector(tag+condition_string);
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
            candidate_parent = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if(candidate_parent != null)
                selected_parent = candidate_parent;
        }else{
            var candidate_parent = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if(candidate_parent && candidate_parent.tagName === tag.toUpperCase()){
                return candidate_parent;
            }
        }
        return selected_parent;
    }
}

async function saveParseData(scraped_data, url_list_id)
{
    //save data to file
    var filename = host_slug + '_' + user_id;
    var scrapedContent = [];
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

    //database connection setting
    const connection  = mysql.createConnection({
                          host     : config.mysql_host,
                          user     : config.mysql_user,
                          password : config.mysql_password,
                          database : config.mysql_database
                      });
    //connect to database
    connection.connect();

    //save data to database
    var data = {'user_id': user_id, 'source': source, 'data': JSON.stringify(scraped_data)};
    var query = connection.query("INSERT INTO scraped_data SET ?", data, function (error, results, fields) {
        if (error) throw error
        if( url_list_id > 0 ){
            var d = new Date();
            var data = { 'updated_at': d.getFullYear() +'-'+ d.getMonth()+'-'+d.getDate() +' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds() };
            //update status of url in database
            var query = connection.query("update tbl_url_lists SET ? where id="+id, _data, function (error, results, fields) {
                if (error) throw error;
            });
        }
    });
    connection.end();
}                