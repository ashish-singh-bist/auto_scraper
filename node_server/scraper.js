const puppeteer = require('puppeteer');
const path 		= require('path');
const fileSystem= require('fs');
const mysql 	= require('mysql')
const config 	= require(path.join(__dirname, 'config/config.js'));

const connection 	= mysql.createConnection({
						  host     : config.mysql_host,
						  user     : config.mysql_user,
						  password : config.mysql_password,
						  database : config.mysql_database
					  });
connection.connect();

var windowOpenWith 	= 'http://' + config.root_ip + ':' + config.root_port ;

var parsing_mode  = process.argv[2];
	
	if ( parsing_mode == 'databasemode') {
		var source =  process.argv[3];
		config.user_id = process.argv[4];

		var data = [config.user_id,source,1];
		// var data = [ 1,source,1];
		var result = [];
		var url_list_array = [];

		var extracted_host_name = '';		//'https://www.youtube.com';
		var process_host_name = '';			//'www_youtube_com'

		var result = [];
		var  getInformationFromDB = function(callback) {
			connection.query("select * from tbl_url_lists Where user_id = ? and source = ? and is_active = ? limit 10", data, function (error, results, fields){
				if (error)  return callback(error);
				if(results.length){
					for(var i = 0; i < results.length; i++){
						result.push(results[i].actual_url);
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
					var url_ = url_list_array[0];
					process_host_name = (url_.split('/'))[2].replace(/\./g,'_');

					var split_ar = url_.split('/');
            		extracted_host_name = split_ar[0] + '//' + split_ar[2];
				}
				run();
			}
		});
		
	}
	else{
		var process_host_name 	= process.argv[3];
		var extracted_host_name = process.argv[4];
		config.user_id = process.argv[5];
		var url_list_array	= (fileSystem.readFileSync(path.join(__dirname, 'storage/product_url/'+process_host_name+'_'+config.user_id+'_url_list_.txt'), 'utf8')).split('\r\n');
		run();
	}


var timeout_1, timeout_2;

createLog('parsing for domain ' + process_host_name + ' for user_id ' + config.user_id + ' started' + '\n');

/*_________________________STEP 1____________________________________*/
	async function run() {
		//declaring the browser which will be opened

        if(config.env == "dev"){
            // //for OVH
            const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        }else{
            const browser = await puppeteer.launch();
        }

	 	//const browser = await puppeteer.launch({headless: false}); //for RTech* (if you want to view the scraping on browser)
        //createLog('puppeteer launch, browser open' + '\n');
		//declaring the variables which will be used in the loop to run and open the pages

	 	var batches =0, list_length =url_list_array.length, lower_limit =0, upper_limit =list_length >=10? 10:list_length, count=0;
        	    
        //createLog('loop started' + '\r\n');
		if(list_length %10 ==0) {
		    myLoop();
		    async function myLoop() {
		        if(count < list_length){
		            for(var i=lower_limit; i< upper_limit; i++){
		            	let page;

		                if(url_list_array[i].indexOf('?') > -1){
		                    let url_ = windowOpenWith+url_list_array[i].replace(extracted_host_name, '').replace(/\;/g,'');
		                    var str = url_+'&config=true&host='+process_host_name+'&uid='+config.user_id ;
		                    console.log("====" + str);
		                    page = await browser.newPage();
							await page.goto(str);
		                    
		                }else{
		                    let url_ = windowOpenWith+url_list_array[i].replace(extracted_host_name, '').replace(/\;/g,'');
		                    var str = url_+'?config=true&host='+process_host_name+'&uid='+config.user_id ;
		                    console.log("====" + str);
		                    page = await browser.newPage();
							await page.goto(str);
		                }
		                
		                count++;
		                page.close();
		            }
		            lower_limit = upper_limit;
		            upper_limit += 10;

		            if(count === list_length){
		            	timeout_2 = setTimeout(function(){
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
		                let page;

		                if(url_list_array[i].indexOf('?') > -1){
		                    let url_ = windowOpenWith+url_list_array[i].replace(extracted_host_name, '').replace(/\;/g,'');
		                    var str = url_+'&config=true&host='+process_host_name+'&uid='+config.user_id;
		                    console.log("====" + str);
		                    page = await browser.newPage();
							await page.goto(str);
		                
		                }else{
		                	let url_ = windowOpenWith+url_list_array[i].replace(extracted_host_name, '').replace(/\;/g,'');
		                    var str = url_+'?config=true&host='+process_host_name+'&uid='+config.user_id;
		                    console.log("====" + str);
		                    page = await browser.newPage();
							await page.goto(str);
		                }
		                count++;
		                page.close();
		            }

		            if(upper_limit === list_length-last_upper_limit){
		                lower_limit = upper_limit;
		                upper_limit += last_upper_limit;
		            } else{
		                lower_limit = upper_limit;
		                upper_limit += 10;
		            }

		            if(count === list_length){
		            	timeout_2 = setTimeout(function(){
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
			clearTimeout(timeout_1);
			clearTimeout(timeout_2);
			await browser.close();
            //createLog('browser close' + '\r\n');
            //createLog('parsing for domain ' + process_host_name + ' for user_id ' + config.user_id + 'end' + '\r\n');
		}
			 		 	
	}

    function createLog(message){
        fileSystem.writeFile(path.join(__dirname, 'storage/log/scraper_log_' + config.user_id + '.txt'), message);
    }

	// run();