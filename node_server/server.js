const express	= require('express');
const app 		= express();
const util		= require('util');
const request 	= require('request');
const path 		= require('path');
const fileSystem= require('fs');
const cheerio	= require('cheerio');
const bodyParser= require('body-parser');
const csv 		= require('fast-csv');

const header 	= require(path.join(__dirname, 'js/headers')); 			//code to clean our headers from invalid characters
const rtech_config	= require(path.join(__dirname, 'config/config'));	//application config

//#================================================================CONFIGURING NODE `APP`
	// parse application/x-www-form-urlencoded
	app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
	 
	// parse application/json
	app.use(bodyParser.json({ limit: '50mb', extended: true }))

	app.use(function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	  next();
	});

	// serve static files.
	app.use('/js', express.static(path.join(__dirname, 'js')));
	app.use('/css', express.static(path.join(__dirname, 'css')));
	app.use('/config', express.static(path.join(__dirname, 'config')));

//#================================================================

//#================================================================VARIABLE(S) DECLARATION
	var split_url		= '';
	var default_host	= '';
	var file_index		= 0;
	var use_ip 			= rtech_config.root_ip + ':' + rtech_config.root_port;
	var jsonArrayFromGET= [];

	var server;
	var scraping_status = {
		done: false,
		success: false
	};
	var inject_code_flag = false;
	
	var HTTP_PREFIX 	= "http://";
	var HTTPS_PREFIX 	= "https://";
	var REL_PREFIX 		= "//";
	var VALID_PREFIXES 	= [HTTP_PREFIX, HTTPS_PREFIX, REL_PREFIX];
	var IGNORE_PREFIXES = ["#", "about:", "data:", "mailto:", "javascript:", "{", "*"];
	var parsedDataArray = [];	
	var debugMode = true;
	var debugLogArr = [];

//#================================================================

//#================================================================GET	
	//this will send the sttaus of the scrapper, whether completed or not
	app.get('/rtech/api/check_scrape', (req, res) => {
		if(scraping_status.done === true){
			if(scraping_status.success){				
				scraping_status.done = false;
		   		scraping_status.success = false;

		   		var temp_parsed_data = parsedDataArray;
		   		parsedDataArray = [];	
		   			
		   		if (debugMode === true) {
					console.log("Scraping is done\n");
					debugLogArr.push("Scraping is done");
				}
				var temp_debugLogArr = debugLogArr;
				debugLogArr = [];
				res.send({status: 200, message: 'scraping done', success: true, data: temp_parsed_data, logs: JSON.stringify(temp_debugLogArr)} )
			}
			else{
				scraping_status.done = false;
		    	scraping_status.success = false;
		    	parsedDataArray = [];	
		   		var temp_debugLogArr = debugLogArr;
				debugLogArr = [];
				res.send({status: 200, message: 'scraping done', success: false, data:[], logs: JSON.stringify(temp_debugLogArr)})
			}
		}else{
			var temp_debugLogArr = debugLogArr;
			debugLogArr = [];
			res.send({status: 500, message: 'scraping going on', data:[], logs: JSON.stringify(temp_debugLogArr)})
		}
	})

	//this will send the analysis of request/reponse we have collected to analysis page
	app.get('/rtech/api/get_analysis_data', (req, res) => {
		res.send(jsonArrayFromGET);
	})

	//this will send the html we have created for analysis page
	app.get('/rtech/api/get_analysis', (req, res) => {
		res.sendFile('analyze.html', {root: __dirname })
	})

	//this will handle all the GET requests we have redirected from the website's page to our server
	app.get('/*', (req, res) => {

		const {headers, url, method} = req;
		const {config, host, analyze} 	= req.query;

		if(config){
			inject_code_flag = true;
		}else{
			inject_code_flag = false;
		}

		if(analyze){
			jsonArrayFromGET = [];
		}
		
		delete headers['host'];

		var complete_path 	= '' + (url).replace(/(\?)*config=(.)+/, '');
		var new_url			= 'http://'+use_ip+'/';
		var target_url;

		if(host) { default_host	= 'https://'+(host).replace(/_/g, '.') };
		if(complete_path && complete_path.startsWith('/http') === false) { if(!complete_path.startsWith(REL_PREFIX)) {target_url = default_host + complete_path} else {target_url = complete_path} }
			else if(complete_path && complete_path.startsWith('/http') === true){ target_url = complete_path.replace(/^\//, '') };
		
		var options = {
			headers: {
					'connection': 'keep-alive',
					'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
					// 'Accept-Language': 'en-US,en;q=0.5', 
				},
			url: target_url,
			encoding: null,
			jar: true //keep the cookies during the redirects;this was included while parsing `https://www.ulta.com/dose-of-colors-x-iluvsarahii-highlighter?productId=xlsImpprod18811035` 
		}

		if(analyze && analyze == 'true'){
			sendRequest(req, res, host, options, config, new_url, true);
		}else{
			sendRequest(req, res, host, options, config, new_url, false);
		}
	})

//#================================================================

//#================================================================GET REQUEST HANDLER
	async function sendRequest(req, res, host, options, config, new_url, analyze){
		var headers, obj;

		if(options['url'].indexOf('https') === -1){
			options['url'] = options['url'].replace('http', 'https')
		}

		if(options['url'].match(/\/\/\//)){
			options['url'] = options['url'].replace(/\/\/\//, '//')
		}

		if(options['url'].startsWith(REL_PREFIX)){
			options['url'] = 'https:' + options['url']
		}

		request(options, function(error, response, body){

			if (!error && response.statusCode == 200) {
				// console.log('++++++++++++++++++++++++++++++++++++>');
				// console.log(options['url']);
				// console.log(String(response.headers['content-type']));
				// console.log(body.toString().length);
				// console.log(inject_code_flag)
				// console.log('++++++++++++++++++++++++++++++++++++>\n');
		
				//#================================================================RESPONSE HEADERS
				headers = response.headers;
				delete headers['content-length'];	//since we're going to manipulate the response content

				//checking if headers do not contain invalid characters (like \u0001)
				//this was included while parsing `https://www.hobbylobby.com/Home-Decor-Frames/Candles-Fragrance/Warmers-Wax-Melts/Pomegranate-Sorbet-Wickless-Fragrance-Cubes/p/80869733`
				if(header.validHeaderName(headers) === false){
					headers = header.cleanHeaderName(headers);
				}

				if(header.validHeaderValue(headers) === false){
					headers = header.cleanHeaderValue(headers);
				}

				res.writeHead(200, headers);
				//#================================================================

				var jsonArrayFromGET_Item = {
						uri: {},
					};
					jsonArrayFromGET_Item['uri']['protocol']= response.request.uri.protocol;
					jsonArrayFromGET_Item['uri']['auth']	= response.request.uri.auth;
					jsonArrayFromGET_Item['uri']['hostname']= response.request.uri.hostname;
					jsonArrayFromGET_Item['uri']['port']	= response.request.uri.port;
					jsonArrayFromGET_Item['uri']['query']	= response.request.uri.query;
					jsonArrayFromGET_Item['uri']['pathname']= response.request.uri.pathname;
					jsonArrayFromGET_Item['uri']['path']	= response.request.uri.path;
					jsonArrayFromGET_Item['uri']['href']	= response.request.uri.href;

					jsonArrayFromGET_Item['REQ_headers']	= response.request.headers;
					jsonArrayFromGET_Item['RES_headers']	= response.headers;
				
				if (String(response.headers['content-type']).indexOf('text/html') !== -1 && body.toString().length > 0 && inject_code_flag){
					// console.log('++++++++++++++++++++++++++++++++++++>');
					// console.log(options['url']);
					// console.log('++++++++++++++++++++++++++++++++++++>\n');

					var $ = cheerio.load(body);

					//#================================================================
					//	1.	get all the elements with `href` or `data-href` attribute OR elements with script, style tags
					//	2.	check if they belong to IGNORE_PREFIXES category
					//		2.a. if yes, don't modify it
					//		2.b. if no, add the reqired prefix
					//#================================================================

					//#================================================================SCRIPT
					$("script").each(function(){
						if( $(this).attr('src') && $(this).attr('src') !== ''){
							var value = $(this).attr('src');

							if(!value && starts_with(value, 'javascript:')){
								return;
							};

							var new_value;

							if(starts_with(value, REL_PREFIX)){
								new_value = new_url + 'https:'+value;
								$(this).attr('src', new_value);
								return ;
							}

							if(starts_with(value, VALID_PREFIXES)){
								new_value = new_url + value;
								$(this).attr('src', new_value);
								return;
							};
							
						}
												
					});

					function starts_with(string, arr_or_prefix) {
						if (!string) { return undefined; }

						if (arr_or_prefix instanceof Array) {
							for (var i = 0; i < arr_or_prefix.length; i++) {
								if (string.indexOf(arr_or_prefix[i]) == 0) {
									return arr_or_prefix[i];
								}
							}
						} else if (string.indexOf(arr_or_prefix) == 0) {
							return arr_or_prefix;
						}

						return undefined;
					}
					// //#================================================================

					// //#================================================================STYLE
					$("style").each(function(){
						var new_text = rewrite_style($(this).html());
						$(this).html(new_text);
					})

					function rewrite_style(value)
					{
					    var STYLE_REGEX = /(url\s*\(\s*[\\"']*)([^)'"]+)([\\"']*\s*\))/gi;

					    var IMPORT_REGEX = /(@import\s+[\\"']*)([^)'";]+)([\\"']*\s*;?)/gi;

					    function style_replacer(match, n1, n2, n3, offset, string) {
					        if(rewrite_url(n2))
					        	return n1 + rewrite_url(n2) + n3;
					        else
					        	return match + new_url
					    }

					    if (!value) {
					        return value;
					    }

					    if (typeof(value) === "object") {
					        value = value.toString();
					    }

					    if (typeof(value) === "string") {
					        value = value.replace(STYLE_REGEX, style_replacer);
					        value = value.replace(IMPORT_REGEX, style_replacer);
					    }

					    return value;
					}

					function rewrite_url(url){
					    
					    if (starts_with(url, IGNORE_PREFIXES)) {
					        return url;
					    }

					    var new_value;

					    if(starts_with(url, REL_PREFIX)){
					        new_value = new_url + 'https:'+url;
					        return new_value;
					    }

					    if(starts_with(url, VALID_PREFIXES)){
					        new_value = new_url + url;
					        return new_value;
					    };
					}
					//#================================================================

					//#================================================================IFRAME
					$("iframe").each(function(){
						if( $(this).attr('src') && $(this).attr('src') !== ''){
							var value = $(this).attr('src');

							if(!value && starts_with(value, 'javascript:')){
								return;
							};

							var new_value;

							if(starts_with(value, REL_PREFIX)){
								new_value = new_url + 'https:'+value;
								$(this).attr('src', new_value);
								return ;
							}

							if(starts_with(value, VALID_PREFIXES)){
								new_value = new_url + value;
								$(this).attr('src', new_value);
								return;
							};
							
						}
												
					});
					// //#================================================================

					//#================================================================HREF
					$("*[href]").each(function(){
						var link = $(this).attr('href');

						if(!link.match(new_url)){

							if(starts_with(link, IGNORE_PREFIXES)){
								return ;
							}

							if(starts_with(link, REL_PREFIX) ){
								var new_link = new_url + 'https:' + link;
								$(this).attr('href', new_link);
								return ;
							}

							if(starts_with(link, VALID_PREFIXES)){
								var new_link = new_url + link;
								$(this).attr('href', new_link);
								return ;
							}
						}
					})
					//#================================================================

					//#================================================================DATA HREF
					$("*[data-href]").each(function(){
						var link = $(this).attr('data-href');

						if(!link.match(new_url)){

							if(starts_with(link, IGNORE_PREFIXES)){
								return ;
							}

							if(starts_with(link, REL_PREFIX) ){
								var new_link = new_url + 'https:' + link;
								$(this).attr('data-href', new_link);
								return ;
							}

							if(starts_with(link, VALID_PREFIXES)){
								var new_link = new_url + link;
								$(this).attr('data-href', new_link);
								return ;
							}
						}
					})
					//#================================================================

					//#================================================================OVERLAY
					$("*[class*='overlay']").each(function(){
						$(this).remove();
					})
					//#================================================================

					//#================================================================REMOVING LINKS FROM IMG
					$("img").each(function(){
						if($(this).parent()[0] && $(this).parent()[0].tagName === 'a'){
							var ele = $(this)[0];
							var required_parent = $(this).parent().parent()[0];
							$(this).parent().remove();
							$(required_parent).append(ele);
						}
					})
					//#================================================================

					//#================================================================CONFIG
					if(config === 'true'){
						obj = fileSystem.readFileSync(path.join(__dirname,'site_config/'+host+'.json'), 'utf8');
						var scriptNodeWithJson = '<script id="scriptNodeWithJson">'+obj+'</script>';
						$('body').append(scriptNodeWithJson);
					}
					//#================================================================

					//#================================================================META
					$("meta").each(function(){
						if($(this).attr('http-equiv') && $(this).attr('http-equiv') === 'refresh'){
							let content = $(this).attr('content');
							let redirect_host = content.split('/')[2];
							let redirect_protocol = '';

							if(content.indexOf('https') > -1)
								redirect_protocol = 'https://';
							else
								redirect_protocol = 'http://';

							let redirect_config = 'false';

							if(redirect_host){
								if (fileSystem.existsSync(path.join(__dirname, 'site_config/'+redirect_host.replace(/\./g, '_')+'.json'))) {
									redirect_config= 'true';
								}else{
									redirect_config = 'false';
								}

								if(analyze === true){
									let url 	= content.replace(redirect_protocol + redirect_host, 'http://' + use_ip) + '&config='+redirect_config+'&host='+redirect_host.replace(/\./g, '_')+'&analyze='+analyze;
									$(this).attr('content', url);
								}else{
									let url 	= content.replace(redirect_protocol + redirect_host, 'http://' + use_ip) + '&config='+redirect_config+'&host='+redirect_host.replace(/\./g, '_');
									$(this).attr('content', url);
								}
								
							}
							
						}

						if($(this).attr('name') && $(this).attr('name') === 'referrer'){
							$(this).attr('content', 'no-referrer-when-downgrade')
						}

						if($(this).attr('http-equiv') && $(this).attr('http-equiv') === 'content-security-policy'){
							$(this).attr('content', '_content')
						}
					})
					//#================================================================

					//#================================================================INJECT JS CODE
					//to disable link clicking on page
					var scriptNode = '<script>window.setTimeout(function(){document.querySelectorAll("a").forEach((tag) => { if(tag.href)tag.addEventListener("click", e => {e.preventDefault(); e.stopPropagation()})});}, 5000);</script>' 
					$('body').append(scriptNode);
					$('body').attr('id', 'enable_right_click');
					//#================================================================

					//#================================================================INJECT CSS CODE
					//for hover/selection border, and css for menu
					var customcss = '<link href="http://'+use_ip+'/css/from-the-page.css" rel="stylesheet">'
					$('head').append(customcss);
					//#================================================================

					//#================================================================INJECT HTML CODE
					var contextmenu	= '<div id="context"><ul><li><div class="form-check"><label class="form-check-label"><input class=" perform_action" type="button" rel="selection_reset" name="selection_reset" id="selection_completed" value="Reset selection"><input class=" perform_action" type="button" rel="done_config" name="done_config" id="done_config" value="Create config"><input class=" perform_action" type="button" rel="select_id" name="select_id" id="select_id" value="Enter ID selector"><input class="block sm-col-4 field-light h3 label_input" style="display:none;" type="text" name="id_selector_text" placeholder="Input selector and press `Enter`" id="id_selector_text" /></label></div></li></ul></div>';
					var labelinput	= '<div id="label_input"><ul><li><div class="form-check"><label class="form-check-label"><form class="form-inline"id="label_input_form"><input class="block sm-col-4 field-light h3 label_input" name="label_input_text" type="text" maxsize="30" placeholder="Label" id="label_input_text"/><textarea disabled class="block sm-col-4 field-light h3" id="label_item_value"></textarea><input class="perform_action" type="button" id="label_input_button" value="OK!"></form></label></div></li></ul></div>';
					
					$('body').append(contextmenu, labelinput);
					//#================================================================

					//#================================================================INJECT JS CODE
					var customjs = '<script src="http://'+use_ip+'/js/script.js" ></script><script src="http://'+use_ip+'/js/jquery-3.3.1.min.js" ></script><script src="http://'+use_ip+'/js/jquery-ui.min.js" ></script><script src="http://'+use_ip+'/js/bootstrap.min.js" ></script><script src="http://'+use_ip+'/config/config.js" ></script>' 
					$('body').append(customjs);
					//#================================================================

					//#================================================================INJECT ANALYZE FLAG
					var flagDiv = '<div id="rtech_analyze" style="display:none;">'+analyze+'</div>';
					$('body').append(flagDiv);
					//#================================================================
					if(analyze == true){
						var loaderDiv = ' <div class="loader_analyze"></div>'
						$('body').append(loaderDiv);
					}

					jsonArrayFromGET_Item['RES_body']	= body.toString();
					jsonArrayFromGET_Item['method']			= response.request.method;

					jsonArrayFromGET.push(jsonArrayFromGET_Item);

					// console.log('=======================================>');
					// console.log($.html());
					// console.log('=======================================>\n');

					res.end($.html());
					
				}else {

					if(String(response.headers['content-type']).indexOf('application/json') !== -1){
						jsonArrayFromGET_Item['RES_body']	= JSON.parse(body.toString());
						jsonArrayFromGET_Item['method']			= response.request.method;

						jsonArrayFromGET.push(jsonArrayFromGET_Item);

					}else{
						jsonArrayFromGET_Item['method']			= response.request.method;

						jsonArrayFromGET.push(jsonArrayFromGET_Item);
					}

					res.end(body);
				}
				
			}else{
				// res.send({status: 500, error: error.reason});
				res.send({status: 500, error: 'Something went wrong'});

			}
		});
	}

//#================================================================POST
	//this will start the scrapping process
	app.post('/rtech/api/scrape_pages', (req, res) => {
		var data = req.body;
		server = require('child_process').spawn('node', ['scraper.js', data.process_host_name, data.extracted_host_name], { shell: true });

		if (debugMode === true) {
			console.log("\nScraping start for : "+data.extracted_host_name);
			debugLogArr.push('Scraping start for : '+data.extracted_host_name);
		}
		
		server.stderr.on('data', function (data) {
		    scraping_status.done = true;
		    scraping_status.success = false;		    
		});

		server.on('close', function (code){
			scraping_status.done = true;
		    scraping_status.success = true;
		    
		})
		
		res.send({status: 200, message: "Scraping start for : "+data.extracted_host_name })
		
	})

	//this will receive the uploaded file of URLs
	app.post('/rtech/api/post_file', (req, res) => {
        if(req.body.length>0){
    		var url_ 	 = req.body[0];
            var split_ar = url_.split('/');
            var host_url = split_ar[0] + '//' + split_ar[2];
    		var filename_= (url_.split('/'))[2].replace(/\./g,'_');
    		var config_exist;

    		if (fileSystem.existsSync(path.join(__dirname, 'site_config/'+filename_+'.json'))) {
    			config_exist = true;
    			//res.send({'exists': true, 'extracted_host_name': filename_})
    		}else{
    			config_exist = false;
    			//res.send({'exists': false, 'extracted_host_name': filename_})
    		}

    		var array_received = (req.body).join('\r\n');

    		fileSystem.writeFile(path.join(__dirname, 'config/url_list_.txt'), array_received, 'utf-8', function(err) {
    			if(err) {
    				res.send({status: 500, file_location: err, 'config_exist':config_exist, 'process_host_name':filename_ , 'extracted_host_name':host_url });
    			}else{
    				res.send({status: 200, file_location: 'config/url_list_.txt', file_content: array_received, 'config_exist':config_exist,'process_host_name':filename_ , 'extracted_host_name' : host_url });
    			}
    		});
        }
        else{
            res.send({status: 500, file_location: err});
        }
	})

	//this will check whether config exists for a particular host or not
	// app.post('/rtech/api/check_config', (req, res) => {
	// 	var url_ 	 = req.body.host;
	// 	var filename_= (url_.split('/'))[2].replace(/\./g,'_');
	// 	if (fileSystem.existsSync(path.join(__dirname, 'site_config/'+filename_+'.json'))) {
	// 		res.send({'exists': true, 'extracted_host_name': filename_})
	// 	}else{
	// 		res.send({'exists': false, 'extracted_host_name': filename_})
	// 	}
		
	// })

	//this will create the config file
	app.post('/rtech/api/done_config', (req, res) => {
		var filename = req.body.url;

		if(typeof req.body.data === 'string'){
			req.body.data = JSON.parse(req.body.data);
		}

		fileSystem.appendFile(path.join(__dirname, 'site_config/'+filename+'.json'), JSON.stringify(req.body), function (err) {
			if (err) throw err;
			console.log('Saved!');
		});
		res.send({})
	})

	//this will write the scrapped data on a csv file
	app.post('/rtech/api/save_scraped_data', (req, res) => {
			
		//#================================================================FOR WRITING ON CSV FILE
		var filename = (req.body.url).split('_')[0];
		if(filename === 'www'){
			filename = (req.body.url).split('_')[1];
		}

		scraping_status.filename = filename;

		var options = {includeEndRowDelimiter:true};
		if(fileSystem.existsSync(path.join(__dirname, 'site_output/'+filename+'.csv'))){
			options['headers'] = false;
		}else{
			options['headers'] = true;
		}
		var csvStream = csv.createWriteStream(options),
	        writableStream = fileSystem.createWriteStream(path.join(__dirname, 'site_output/'+filename+'.csv'), {flags: 'a'});
	    writableStream.on('finish', function(){
	    });

	    if(typeof req.body.data === 'string'){
	    	req.body.data = JSON.parse(req.body.data)
	    }
	    
	    csvStream.pipe(writableStream);
	    csvStream.write(req.body.data[0]);  				
		parsedDataArray.push(req.body.data[0]);
    
	    //console.log(parsedDataArray);

	    fileSystem.writeFile(path.join(__dirname, 'site_output/'+filename+'.json'), JSON.stringify(parsedDataArray), function (err) {
			if (err) throw err;			
		});


		if (debugMode === true) {
			console.log("Scraped data for : "+req.body.data[0].url);			
			debugLogArr.push("Scraped data for : "+req.body.data[0].url);
		}

	    //console.log(req.body.data[0]);
	    csvStream.end();				
		res.send({})
	})

	//this will handle all the POST requests we have redirected from the website's page to our server
	app.post('/*', (req, res) => {

		var options = {
			form: req.body,
			url: default_host + req.originalUrl,
			hostname: default_host.replace('https://', ''),
			headers: {
				'content-type': req.headers['content-type'],
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0'
			}
		}

		if((req.originalUrl).match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/)){
			options['url'] = req.originalUrl.replace(/^\//, '');
		}

		request.post(options, function(err,httpResponse,body){
			if(!err && httpResponse){

				var jsonArrayFromGET_Item = {
					uri: {},
				};
				jsonArrayFromGET_Item['uri']['protocol']= httpResponse.request.uri.protocol;
				jsonArrayFromGET_Item['uri']['auth']	= httpResponse.request.uri.auth;
				jsonArrayFromGET_Item['uri']['hostname']= httpResponse.request.uri.hostname;
				jsonArrayFromGET_Item['uri']['port']	= httpResponse.request.uri.port;
				jsonArrayFromGET_Item['uri']['query']	= httpResponse.request.uri.query;
				jsonArrayFromGET_Item['uri']['pathname']= httpResponse.request.uri.pathname;
				jsonArrayFromGET_Item['uri']['path']	= httpResponse.request.uri.path;
				jsonArrayFromGET_Item['uri']['href']	= httpResponse.request.uri.href;

				jsonArrayFromGET_Item['REQ_headers']	= httpResponse.request.headers;
				jsonArrayFromGET_Item['RES_headers']	= httpResponse.headers;

				if(String(httpResponse.headers['content-type']).indexOf('application/json') !== -1 || String(httpResponse.headers['content-type']).indexOf('text/javascript') !== -1){
					jsonArrayFromGET_Item['RES_body']	= JSON.parse(body.toString());
					jsonArrayFromGET_Item['method']			= httpResponse.request.method;

					jsonArrayFromGET.push(jsonArrayFromGET_Item);
					
				}else{
					jsonArrayFromGET_Item['method']			= httpResponse.request.method;

					jsonArrayFromGET.push(jsonArrayFromGET_Item);
				}

				res.writeHead(200, httpResponse.headers);
				res.end(body);
			}else{
				res.writeHead(500);
				res.end(err);
			}			
		})
	})
//#================================================================

app.listen(rtech_config.root_port, () => console.log('Example app listening on port '+rtech_config.root_port));

//#================================================================for https
// [STEPS]
// - create a folder `security` in root folder
// - set OPENSSL_CONF=C:\Users\DELL\Downloads\openssl.cnf
// - c:\Users\DELL\Downloads\bin\openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
//
// const https 	= require('https');
// var privateKey  = fileSystem.readFileSync('./security/key.pem', 'utf8');
// var certificate = fileSystem.readFileSync('./security/cert.pem', 'utf8');
// var credentials = {key: privateKey, cert: certificate};
// var httpsServer = https.createServer(credentials, app);

// httpsServer.listen(8443);
//#================================================================