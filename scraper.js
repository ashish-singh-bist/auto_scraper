const puppeteer = require('puppeteer');
const path 		= require('path');
const fileSystem= require('fs');
const config 	= require(path.join(__dirname, 'config/config.js'));

var url_list_array	= (fileSystem.readFileSync(path.join(__dirname, 'config/url_list_.txt'), 'utf8')).split('\r\n');
var windowOpenWith 	= 'http://' + config.root_ip + ':' + config.root_port ;
var process_host_name 	= process.argv[2];
var extracted_host_name = process.argv[3];

var timeout_1, timeout_2;

/*_________________________STEP 1____________________________________*/
	async function run() {
		//declaring the browser which will be opened
	 	// const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}); //for OVH
	 	const browser = await puppeteer.launch({headless: false}); //for RTech* (if you want to view the scraping)

	 	//declaring the variables which will be used in the loop to run and open the pages
	 	var batches =0, list_length =url_list_array.length, lower_limit =0, upper_limit =list_length >=10? 10:list_length, count=0;
            
            
		if(list_length %10 ==0){
		    myLoop();
		    async function myLoop() {
		        if(count < list_length){
		            for(var i=lower_limit; i< upper_limit; i++){
		            	let page;

		                if(url_list_array[i].indexOf('?') > -1){
		                    let url_ = windowOpenWith+url_list_array[i].replace(extracted_host_name, '').replace(/\;/g,'');
		                    var str = url_+'&config=true&host='+process_host_name ;
		                    page = await browser.newPage();
							await page.goto(str);
		                    
		                }else{
		                    let url_ = windowOpenWith+url_list_array[i].replace(extracted_host_name, '').replace(/\;/g,'');
		                    var str = url_+'?config=true&host='+process_host_name ;
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
		                    var str = url_+'&config=true&host='+process_host_name;
		                    page = await browser.newPage();
							await page.goto(str);
		                
		                }else{
		                	let url_ = windowOpenWith+url_list_array[i].replace(extracted_host_name, '').replace(/\;/g,'');
		                    var str = url_+'?config=true&host='+process_host_name;
		                    page = await browser.newPage();
							await page.goto(str);
		                }
		                count++;
		                page.close();
		            }

		            if(upper_limit === list_length-last_upper_limit){
		                lower_limit = upper_limit;
		                upper_limit += last_upper_limit;
		            }else{
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
		}
			 		 	
	}

	run();