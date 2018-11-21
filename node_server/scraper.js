const puppeteer = require('puppeteer');
const path      = require('path');
const fileSystem= require('fs');
const mysql     = require('mysql')
const config    = require(path.join(__dirname, 'config/config.js'));

const connection    = mysql.createConnection({
                          host     : config.mysql_host,
                          user     : config.mysql_user,
                          password : config.mysql_password,
                          database : config.mysql_database
                      });
connection.connect();
console.log("Scraper: Database connected");

var windowOpenWith  = 'http://' + config.root_ip + ':' + config.root_port ;

var parsing_mode  = process.argv[2];

if ( parsing_mode == 'databasemode') {
    var source =  process.argv[3];
    config.user_id = process.argv[4];

    var data = [config.user_id, source, 1];
    // var data = [ 1,source,1];
    var result = [];
    var url_list_array = [];

    var extracted_host_name = '';       //'https://www.youtube.com';
    var process_host_name = '';         //'www_youtube_com'

    var  getInformationFromDB = function(callback) {
        connection.query("select * from tbl_url_lists Where user_id = ? and source = ? and is_active = ? and updated_at IS NULL and actual_url IS NOT NULL limit 10", data, function (error, results, fields){
            if (error)  return callback(error);
            if(results.length){
                for(var i = 0; i < results.length; i++){
                    result.push({ 'act_url':results[i].actual_url, 'url_list_id':results[i].id, 'ref_id':results[i].ref_id, 'source':results[i].source});
                }
            }
            callback(null, result);
        });
    };

    getInformationFromDB(function (error, result) {
        if (error) console.log("Database error!");
        else {
            url_list_array = result;
            if ( url_list_array.length > 0 )  {
                var url_ = url_list_array[0].act_url;
                process_host_name = (url_.split('/'))[2].replace(/\./g,'_');

                var split_ar = url_.split('/');
                extracted_host_name = split_ar[0] + '//' + split_ar[2];
            }
            // console.log(url_list_array);
            run();
        }
    });
    
}
else{
    var process_host_name   = process.argv[3];
    var extracted_host_name = process.argv[4];
    config.user_id = process.argv[5];
    var url_list_array = [];
    var url_arr_ = (fileSystem.readFileSync(path.join(__dirname, 'storage/product_url/'+process_host_name+'_'+config.user_id+'_url_list_.txt'), 'utf8')).split('\r\n');
    for(var i = 0; i < url_arr_.length; i++){
        url_list_array.push({ 'act_url':url_arr_[i] });
    }
    run();
}

var timeout_1, timeout_2;

createLog('parsing for domain ' + process_host_name + ' for user_id ' + config.user_id + ' started' + '\n');

/*_________________________STEP 1____________________________________*/
    async function run() {
        //declaring the browser which will be opened

        const browser = await puppeteer.launch();
        if(config.env == "dev"){
            // //for OVH
            browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        }
        console.log("Scraper: Browser opened");

        //const browser = await puppeteer.launch({headless: false}); //for RTech* (if you want to view the scraping on browser)
        //createLog('puppeteer launch, browser open' + '\n');
        //declaring the variables which will be used in the loop to run and open the pages

        var batches =0, list_length =url_list_array.length, lower_limit =0, upper_limit =list_length >=10? 10:list_length, count=0;
        console.log("==================list length:" + list_length + "upper_limit: " + upper_limit);
        //createLog('loop started' + '\r\n');

        if(list_length %10 ==0) {
            myLoop();
            async function myLoop() {
                //createLog('inside 1 loop ' + count + "===============" + list_length + '\n');
                if(count < list_length){
                    for(var i=lower_limit; i< upper_limit; i++){

                        try{

                            let page;

                            if(url_list_array[i].act_url.indexOf('?') > -1){
                                let url_ = windowOpenWith+url_list_array[i].act_url.replace(extracted_host_name, '').replace(/\;/g,'');
                                var str = url_+'&config=true&host='+process_host_name+'&uid='+config.user_id ;
                                if ( parsing_mode == 'databasemode')
                                    str += '&url_list_id='+url_list_array[i].url_list_id+'&ref_id='+url_list_array[i].ref_id+'&source='+url_list_array[i].source;
                                console.log('1str - '+str);
                                page = await browser.newPage();
                                await page.goto(str);
                                
                            }else{
                                let url_ = windowOpenWith+url_list_array[i].act_url.replace(extracted_host_name, '').replace(/\;/g,'');
                                var str = url_+'?config=true&host='+process_host_name+'&uid='+config.user_id ;
                                if ( parsing_mode == 'databasemode')
                                    str += '&url_list_id='+url_list_array[i].url_list_id+'&ref_id='+url_list_array[i].ref_id+'&source='+url_list_array[i].source;
                                console.log('2str - '+str);
                                page = await browser.newPage();
                                await page.goto(str);
                            }
                            
                            count++;
                            page.close();
                        }
                        catch(err) {
                            createLog(err.message + '\n');
                        }

                    }
                    lower_limit = upper_limit;
                    upper_limit += 10;
                    console.log("count = " + count);
                    if(count === list_length){
                        timeout_2 = setTimeout(function(){
                            console.log("end loop");
                            end_loop();
                        }, 10000)
                    }

                    timeout_1 = setTimeout(function(){
                        myLoop();
                    }, 20000);//calling a new batch every 60 seconds
                    
                }
            }

        }else{
            var last_upper_limit = list_length %10;
            myLoop();
            async function myLoop() {
                if(count < list_length){
                    for(var i=lower_limit; i< upper_limit; i++){
                        //createLog('inside 2 loop if i= ' + i + "===============" + list_length + '\n');
                        console.log(i);
                        try{
                            let page;

                            if(url_list_array[i].act_url.indexOf('?') > -1){
                                let url_ = windowOpenWith+url_list_array[i].act_url.replace(extracted_host_name, '').replace(/\;/g,'');
                                var str = url_+'&config=true&host='+process_host_name+'&uid='+config.user_id;
                                if ( parsing_mode == 'databasemode')
                                    str += '&url_list_id='+url_list_array[i].url_list_id+'&ref_id='+url_list_array[i].ref_id+'&source='+url_list_array[i].source;
                                console.log('3str - '+str);
                                page = await browser.newPage();
                                await page.goto(str);
                            
                            }else{
                                let url_ = windowOpenWith+url_list_array[i].act_url.replace(extracted_host_name, '').replace(/\;/g,'');
                                var str = url_+'?config=true&host='+process_host_name+'&uid='+config.user_id;
                                if ( parsing_mode == 'databasemode')
                                    str += '&url_list_id='+url_list_array[i].url_list_id+'&ref_id='+url_list_array[i].ref_id+'&source='+url_list_array[i].source;
                                console.log('4str - '+str);
                                page = await browser.newPage();
                                await page.goto(str);
                            }
                            count++;
                            page.close();
                        }
                        catch(err) {
                            createLog(err.message + '\n');
                            console.log(err.message);
                        }
                                            }
                    //createLog('loop' + upper_limit + '\n');
                    if(upper_limit === list_length-last_upper_limit){
                        lower_limit = upper_limit;
                        //upper_limit += last_upper_limit;
                    } else{
                        lower_limit = upper_limit;
                        //upper_limit += 10;
                    }
                    console.log("count = " + count + " list_length " + list_length);
                    if(count === list_length){
                        timeout_2 = setTimeout(function(){
                            console.log("end loop");
                            end_loop();
                        }, 10000)
                    }
                    
                    timeout_1 = setTimeout(function(){
                        myLoop();
                    }, 20000);//calling a new batch every 60 seconds
                    
                }
            }

        }

        async function end_loop(){
            createLog('browser close' + '\n');
            clearTimeout(timeout_1);
            clearTimeout(timeout_2);
            await browser.close();
            console.log("end");
            //createLog('parsing for domain ' + process_host_name + ' for user_id ' + config.user_id + 'end' + '\r\n');
        }

    }

    async function createLog(message){
        fileSystem.writeFile(path.join(__dirname, 'storage/log/scraper_log_' + config.user_id + '.txt'), message);
    }

    // run();