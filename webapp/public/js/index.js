$( document ).ready(function(){
	$('#file_upload').val('');
	$('#text_input_urls').val('');
	document.getElementById('submit_btn').setAttribute('disabled', 'true');

	//declaring reqired variables
	var url_list_array = [];
	var extracted_host_name, flag, process_host_name, argument_analyze_;
	var parsedJson = [{'title':'abc','price':'2.992'},{'title':'abc','price':'2.992'},{'title':'abc','price':'2.992'},{'title':'abc','price':'2.992'}];
	var windowOpenWith = 'http://' + config.root_ip + ':' + config.root_port;

	function fileUpload( param ) {
		document.getElementById('submit_btn').setAttribute('style', 'display:visible;');
		let url_list_array_ = [];
		let msg = 'abc';

		if( param == 'textarea'){
			let input_url = document.getElementById('text_input_urls').value;
			url_list_array_  = input_url.split('\n');
			fileUploadAjax(url_list_array_);
		}else{
			let file = document.getElementById('file_upload').files[0];
			let reader = new FileReader();
			reader.readAsText(file);
			reader.onload = function(event) {
				url_list_string = event.target.result;
				url_list_array_  = url_list_string.split('\r\n');
				fileUploadAjax(url_list_array_);
			};
		}
	}	

	function fileUploadAjax(url_list_array_){
		// a POST request will upload the file at server end for further processing
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
				//file upload was successfull
				document.getElementById('label_file_upload').style['color'] = '#459246';
				url_list_array = res.file_content.split('\r\n');
				proceedWithUrls();
			}else{
				//file upload was unsuccessful
				document.getElementById('label_file_upload').style['color'] = 'tomato';
				document.getElementById('submit_btn').setAttribute('disabled', 'true');
			}
		})
		.catch(() => {
			//file upload was unsuccessful
			document.getElementById('label_file_upload').style['display'] = 'block';
			document.getElementById('label_file_upload').style['color'] = 'tomato';
			document.getElementById('submit_btn').setAttribute('disabled', 'true');
		})
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
			proceedForParsing(flag, process_host_name, url_list_array);
		})
		.catch(err => {
			//flag will hold value true or false, representing whether config exists or not, respectively.
			flag = res.exists;
			//`process_host_name` will hold the host part of the URL and is different from `extracted_host_name`. eg.
			//`process_host_name` could be `www_gnc_com`, but extracted host name will be `http://www.gnc.com
			process_host_name = res.extracted_host_name;
		});
	}

	$('#file_upload').change(function(evt){
		document.getElementById('label_file_upload').innerText = evt.target.files[0].name;
		if ( document.getElementById('file_upload').files[0] ) {
			$('#submit_btn').prop('disabled', false);
		}else{
			$('#submit_btn').prop('disabled', true);
		}
	});

	$('#text_input_urls').bind('input propertychange', function() {
		if( $('#text_input_urls').val().length > 0 ){
			$('#submit_btn').prop('disabled', false);
		}else{
			$('#submit_btn').prop('disabled', true);
		}
	});

	//function called on clicking submit button
	$('#submit_btn').click(function(evt){
		evt.preventDefault();
		if( $('#text_input_urls').val().length > 0 ){
			fileUpload('textarea');
			// console.debug('textarea have value');		//debug msg
		}else{
			if ( document.getElementById('file_upload').files[0] ) {
				fileUpload('file');	
				// console.debug('file have fileobject');		//debug msg
			}
		}
	});

	//calling function for opening link in browsers
	function proceedForParsing (flag, process_host_name, url_list_array) {
		argument_analyze_ = document.getElementById('file_analyze').checked;
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
					var html = "";
					if(res.data.length > 0){
						parsedJson = res.data;
				 		html = "<table class='table table-bordered capitalised'>"
						parsedJson.forEach(function (obj, index) {
							if( index == 0 ){
								html += "<tr>";
								for (var key in obj) {
									if (obj.hasOwnProperty(key)) 
										html += "<th>" + key + "</th>";					
								}
								html += "</tr>";
							}
							
							html += "<tr>";
							for (var key in obj) {
								if (obj.hasOwnProperty(key))
									html += "<td>" + obj[key] + "</td>";
							}
							html += "</tr>";
						});
						html += "</table>";
						$('#fileUploadContainer').hide();
						$('#fileResponseContainer').show();
						$('#fileResponseContainerData').html( html );
					}
					else{
						$('#fileUploadContainer').hide();
						$('#fileResponseContainer').show();
						$('#fileResponseContainerData').html( 'No data found' );	
					}
					document.getElementById('progress_bar').style['display'] = 'none';
					clearInterval(myInterval);
				}                
			});
		}, 10000)
	}
 	
 	function showMsg( type, msg, duration = 5000 ){
 		$('#msgBox').show();
 		$('#msgBox').addClass(type);
 		$('#msgBoxMessage').html(msg);
 		setTimeout(function(){ 
 			$('#msgBox').fadeOut();
 			$('#msgBox').removeClass(type);
 		}, duration);
 	}
});