const fileSystem= require('fs');
const path 		= require('path');
const request 	= require('request');

var argument_url_= process.argv[2];

var argument_analyze_ = process.argv[3];

var rtech_config = require(path.join(__dirname, 'config/config'));

var server;

if(argument_url_.indexOf('http') > -1){
	//case when the 2nd argument provided is a URL

	//extract the host name from URL
    argument_url_ = argument_url_.replace(/\;/g, '');
	let extracted_host_name;
	let temporary_url_split = argument_url_.split('/');
	let windowOpenWith = 'http://' + rtech_config.root_ip + ':' + rtech_config.root_port;

	while(temporary_url_split.length != 3){
        temporary_url_split.pop();
    }
    extracted_host_name = temporary_url_split.join('/');
    
    //calling function which will extract necessary query string arguments from URL
    proceedWithUrls();
    function proceedWithUrls(){
		let data = {
			host: extracted_host_name
		}
	        
	    //check whether a config exists for the URL
		request.post('http://'+ rtech_config.root_ip + ':' + rtech_config.root_port +'/rtech/api/check_config', {form:data}, function(err, httpResponse, body){
	        let response = JSON.parse(body);
	        let flag = response.exists;
	        let process_host_name = response.extracted_host_name;
	        argument_url_ = argument_url_.replace(extracted_host_name, '');
	        proceedForParsing(flag, process_host_name, argument_url_);
		})
	}
	    
    //calling function for opening link in browsers
    function proceedForParsing (flag, process_host_name, argument_url_) {
        if(flag && !argument_analyze_){
        	//case: config exists and we have to only scrape data
            let url_ = windowOpenWith+argument_url_;
                if(url_.indexOf('?') > -1){
                    
                    var str = '"' + url_+'&config='+flag+'&host='+process_host_name + '"';
                    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
                    server = require('child_process').spawn(start, [str], { shell: true });
				}else{
                    
                    var str = '"' + url_+'?config='+flag+'&host='+process_host_name + '"';
                    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
                    server = require('child_process').spawn(start, [str], { shell: true });
				}
        }else if(argument_analyze_){
        	//case: analysis has been requested
        	let url_ = windowOpenWith+argument_url_;
            if(url_.indexOf('?') > -1){
                
                var str = '"' + url_+'&config=false'+'&host='+process_host_name+'&analyze=true' + '"';
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
				server = require('child_process').spawn(start, [str], { shell: true });
            }else{
                var str = '"' + url_+'?config=false'+'&host='+process_host_name+'&analyze=true' + '"';
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
				server = require('child_process').spawn(start, [str], { shell: true });
            }
        }else{
        	//case: config doesn't exists and we have to create one
            let url_ = windowOpenWith+argument_url_;
            if(url_.indexOf('?') > -1){
                
                var str = '"' + url_+'&config='+flag+'&host='+process_host_name + '"';
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
                server = require('child_process').spawn(start, [str], { shell: true });
			}else{
                
                var str = '"' + url_+'?config='+flag+'&host='+process_host_name + '"';
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
                server = require('child_process').spawn(start, [str], { shell: true });
			}
        }
    }

}else{
	//read urls from file
	// let list = fileSystem.readFileSync(path.join(__dirname, 'config/url_list_.txt'), 'utf8');
    // let list = fileSystem.readFileSync(argument_url_, 'utf8');
    let list = fileSystem.readFileSync(path.join(__dirname, 'crawledurls/'+ argument_url_+'.txt'), 'utf8');

	//extracting urls into an array
	let url_list_array = list.split('\n');
	let extracted_host_name, flag, process_host_name;
	var windowOpenWith = 'http://' + rtech_config.root_ip + ':' + rtech_config.root_port;

	//calling function which will extract necessary query string arguments
	proceedWithUrls();
	function  proceedWithUrls(){
	    for( let i=0; i< url_list_array.length; i++) {

            let url = url_list_array[i]
            
            if( i==0 ){

                let temporary_url_split = url.split('/');
                while(temporary_url_split.length != 3){
                    temporary_url_split.pop();
                }
                extracted_host_name = temporary_url_split.join('/');
            }

            url_list_array[i]   = url_list_array[i].replace(extracted_host_name, '');
        }

        let data = {
            host: extracted_host_name
        }
        
        request.post('http://'+ rtech_config.root_ip + ':' + rtech_config.root_port +'/rtech/api/check_config', {form:data}, function(err, httpResponse, body){
        	var response = JSON.parse(body);
        	flag = response.exists;
        	process_host_name = response.extracted_host_name;
        	proceedForParsing(flag, process_host_name, url_list_array);
        })
    }

    //calling function for opening link in browsers
    function proceedForParsing (flag, process_host_name, url_list_array) {
    	//from here we'll divide all the URLs into batches to be executed
	    if(flag && !argument_analyze_){
	    	//case: config exists and we have to only scrape data
        	var batches =0, list_length =url_list_array.length, lower_limit =0, upper_limit =list_length >=10? 10:list_length, count=0;
        	
        	if(list_length %10 ==0){
        		myLoop();
        		function myLoop() {
        			if(count < list_length){
        				for(var i=lower_limit; i< upper_limit; i++){
        					if(url_list_array[i].indexOf('?') > -1){
        						let url_ = windowOpenWith+url_list_array[i].replace(/\;/,'');
		        				var str = '"' + url_+'&config='+flag+'&host='+process_host_name + '"';
		        				var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
								server = require('child_process').spawn(start, [str], { shell: true });
        					}else{
        						let url_ = windowOpenWith+url_list_array[i].replace(/\;/,'');
		        				var str = '"' + url_+'?config='+flag+'&host='+process_host_name + '"';
		        				var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
								server = require('child_process').spawn(start, [str], { shell: true });
        					}
	        				
	        				count++;
	        			}
	        			lower_limit = upper_limit;
	        			upper_limit += 10;
	        			setTimeout(function(){
	        				myLoop();
	        			}, 60000);//calling a new batch every 60 seconds
	        			
        			}
        		}

        	}else{
        		var last_upper_limit = list_length %10;
        		myLoop();
        		function myLoop() {
        			if(count < list_length){
        				for(var i=lower_limit; i< upper_limit; i++){
        					
        					if(url_list_array[i].indexOf('?') > -1){
        						let url_ = windowOpenWith+url_list_array[i].replace(/\;/,'');
		        				var str = '"' + url_+'&config='+flag+'&host='+process_host_name + '"';
		        				var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
								server = require('child_process').spawn(start, [str], { shell: true });

        					}else{
        						let url_ = windowOpenWith+url_list_array[i].replace(/\;/,'');
		        				var str = '"' + url_+'?config='+flag+'&host='+process_host_name + '"';
		        				var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
								server = require('child_process').spawn(start, [str], { shell: true });
							}
	        				count++;
	        			}

	        			if(upper_limit === list_length-last_upper_limit){
	        				lower_limit = upper_limit;
	        				upper_limit += last_upper_limit;
	        			}else{
	        				lower_limit = upper_limit;
	        				upper_limit += 10;
	        			}
	        			
	        			setTimeout(function(){
	        				myLoop();
	        			}, 60000);//calling a new batch every 60 seconds
	        			
        			}
        		}

        	}
        	
        }else if(argument_analyze_){
        	//case: analysis has been requested
        	let url_ = windowOpenWith+url_list_array[0].replace(/\;/,'');
            if(url_.indexOf('?') > -1){
                
                var str = '"' + url_+'&config=false'+'&host='+process_host_name+'&analyze=true' + '"';
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
				server = require('child_process').spawn(start, [str], { shell: true });
            }else{
                var str = '"' + url_+'?config=false'+'&host='+process_host_name+'&analyze=true' + '"';
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
				server = require('child_process').spawn(start, [str], { shell: true });
            }
        }else{
        	//case: config doesn't exists and we have to create one
        	let url_ = windowOpenWith+url_list_array[0];
            if(url_.indexOf('?') > -1){
                
                var str = '"' + url_+'&config='+flag+'&host='+process_host_name + '"';
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
				server = require('child_process').spawn(start, [str], { shell: true });
            }else{
                var str = '"' + url_+'?config='+flag+'&host='+process_host_name + '"';
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
				server = require('child_process').spawn(start, [str], { shell: true });
            }
        }
    }

}
