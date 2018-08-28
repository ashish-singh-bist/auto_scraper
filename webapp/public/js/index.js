$( document ).ready(function(){
	//attaching event handlers to file input box and submit button
	document.getElementById('file-upload').addEventListener('change', readFile, false);
	document.getElementById('text-input-urls').addEventListener('change', loadInputUrls, false);
	document.getElementById('text-input-urls').addEventListener('input', onInputUrls, false);
	document.getElementById('submit-btn').addEventListener('click', submitform, false);


	//declaring reqired variables
	var url_list_array = [];
	var extracted_host_name, flag, process_host_name, argument_analyze_;
	var windowOpenWith = 'http://' + config.root_ip + ':' + config.root_port;

	//this function will be triggered as soon as you select a file. After selecting file, if this input box turns green, you're good to go. If it turns red, means there is some problem at the server end.
	function readFile (evt) {
		document.getElementById('submit-btn').setAttribute('style', 'display:visible;');
		document.getElementById('label-file-upload').innerText= evt.target.files[0].name;
		let url_list_array_ = [], url_list_string;
		let files = evt.target.files;
		let file = files[0];           
		let reader = new FileReader();
		reader.onload = function(event) {
			url_list_string = event.target.result;
			url_list_array_  = url_list_string.split('\r\n');
			//a POST request will upload the file at server end for further processing
			fetch('http://'+config.root_ip+':'+config.root_port+'/rtech/api/post_file', {
				body: JSON.stringify(url_list_array_),
				headers: {
					'content-type': 'application/json' 
				},
				method: 'POST'
			})
			.then(response => response.json())
			.then(res => {
				document.getElementById('label-file-upload').style['display'] = 'block';
				if(res.status == 200){
					//file upload was successfull
					document.getElementById('label-file-upload').style['color'] = '#459246';
					//extracting file's contents i.e. URLs
					url_list_array = res.file_content.split('\r\n');
					proceedWithUrls();
				}else{
					//file upload was unsuccessful
					document.getElementById('label-file-upload').style['color'] = 'tomato';
					document.getElementById('submit-btn').setAttribute('disabled', 'true');
				}
			})
			.catch(() => {
				//file upload was unsuccessful
				document.getElementById('label-file-upload').style['display'] = 'block';
				document.getElementById('label-file-upload').style['color'] = 'tomato';
				document.getElementById('submit-btn').setAttribute('disabled', 'true');
			})
		}
		reader.readAsText(file);
	}

	function loadInputUrls (evt){
		document.getElementById('submit-btn').setAttribute('style', 'display:visible;');
		//document.getElementById('text-input-url').innerText= evt.target.text();		
		let url_list_array_ = [];
		let input_url = document.getElementById('text-input-urls').value;
		if (input_url){
			url_list_array_  = input_url.split('\n');
			//a POST request will upload the file at server end for further processing
			fetch('http://'+config.root_ip+':'+config.root_port+'/rtech/api/post_file', {
				body: JSON.stringify(url_list_array_),
				headers: {
					'content-type': 'application/json' 
				},
				method: 'POST'
			})
			.then(response => response.json())
			.then(res => {
				if(res.status == 200){
					//extracting file's contents i.e. URLs
					url_list_array = res.file_content.split('\n');
					proceedWithUrls();
				}
			})
			.catch(() => {
				//file upload was unsuccessful
				document.getElementById('label-file-upload').style['display'] = 'block';
				document.getElementById('label-file-upload').style['color'] = 'tomato';
				document.getElementById('submit-btn').setAttribute('disabled', 'true');
			});
		}		
	}


	function  proceedWithUrls(){
		//the following tasks are performed using this function
		// 1) extract host name in `extracted_host_name`
		// 2) check if config exists for that host
		console.log(url_list_array);
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
		//this POST request will send the exracted host name to the server and check whether a config exists for the extracted host name.
		//if exists, it will start scraping the URLs.
		//if not, it will select the first URL from the list and open it to `create config`
		fetch('http://'+ config.root_ip + ':' + config.root_port +'/rtech/api/check_config', {
			body: JSON.stringify(data),
			headers: {
				'content-type': 'application/json' 
			},
			method: 'POST'
		})
		.then(response => response.json())
		.then(res => {
			//`flag` will hold value true or false, representing whether config exists or not, respectively.
			flag = res.exists;
			//`process_host_name` will hold the host part of the URL and is different from `extracted_host_name`. eg.
			//`process_host_name` could be `www_gnc_com`, but extracted host name will be `http://www.gnc.com`
			process_host_name = res.extracted_host_name;
		})
		.catch(err => {
			//flag will hold value true or false, representing whether config exists or not, respectively.
			flag = res.exists;
			//`process_host_name` will hold the host part of the URL and is different from `extracted_host_name`. eg.
			//`process_host_name` could be `www_gnc_com`, but extracted host name will be `http://www.gnc.com
			process_host_name = res.extracted_host_name;
		});
	}

	//function called on clicking submit button
	function submitform(evt) {
		//prevent automatic refresh of page on submit
		evt.preventDefault();
		proceedForParsing(flag, process_host_name, url_list_array);
	}

	//calling function for opening link in browsers
	function proceedForParsing (flag, process_host_name, url_list_array) {
		argument_analyze_ = document.getElementById('file-analyze').checked;
		//from here we'll divide all the URLs into batches to be executed
		if(flag && !argument_analyze_){
			//case: config exists and we have to only scrape data
			document.getElementById('progress_bar').style['display'] = 'block';
			//eg {process_host_name: 'www_gnc_com', extracted_host_name: 'http://www.gnc.com'}
			let data = {
				process_host_name: process_host_name,
				extracted_host_name: extracted_host_name
			}
			//POST request which will tell the server to start scraping the URLs from the file uploaded earlier via readFile() method
			fetch('http://'+ config.root_ip + ':' + config.root_port +'/rtech/api/scrape_pages', {
				body: JSON.stringify(data),
				headers: {
					'content-type': 'application/json' 
				},
				method: 'POST'
			})
			.then(response => response.json())
			.then(res => {
				//if scraping started successfully, call the below function which will check every 10 seconds the status of scraping
				check_scraping_status();
			});
		}else if(argument_analyze_){
			//case: analysis has been requested
			let url_ = windowOpenWith + url_list_array[0].replace(/\;/g,'');
			if(url_.indexOf('?') > -1){
				var str = url_+'&config=false'+'&host='+process_host_name+'&analyze=true';
				window.open(str,'_blank');
			}else{
				var str = url_+'?config=false'+'&host='+process_host_name+'&analyze=true';
				window.open(str,'_blank');
			}
		}else{
			//case: config doesn't exists and we have to create one
			let url_ = windowOpenWith + url_list_array[0];
			if(url_.indexOf('?') > -1){
				var str = url_+'&config='+flag+'&host='+process_host_name;
				window.open(str,'_blank');
			}else{
				var str = url_+'?config='+flag+'&host='+process_host_name;
				window.open(str,'_blank');
			}
		}
	}

	//function which'll check the status of scraping every 10 seconds. If scrapping completed successfully, it removes the loader and overlay from screen
	function check_scraping_status(){
		var myInterval = setInterval(() => {
			fetch('http://'+ config.root_ip + ':' + config.root_port +'/rtech/api/check_scrape', {
				headers: {
					'content-type': 'application/json' 
				},
				method: 'GET'
			})
			.then(response => response.json())
			.then(res => {
				if(res.status === 200){
					document.getElementById('progress_bar').style['display'] = 'none';
					clearInterval(myInterval);
				}                
			});
		}, 10000)
	}
	function onInputUrls() {
		document.getElementById('submit-btn').setAttribute('style', 'display:visible;');
		//document.getElementById('submit-btn').setAttribute('disabled', 'false');
    }
});