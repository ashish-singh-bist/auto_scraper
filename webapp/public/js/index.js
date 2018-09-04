$( document ).ready(function(){
	$('#file_upload').val('');
	$('#text_input_urls').val('');
	$('#file_analyze').prop('checked', false);
	$('#is_debug').prop('checked', true);
	document.getElementById('submit_btn').setAttribute('disabled', 'true');
	document.getElementById('analysis_btn').setAttribute('disabled', 'true');

	//declaring reqired variables
	var url_list_array = [], parsedJson = [];
	var extracted_host_name, flag, process_host_name, argument_analyze_, url_post_part;
	var windowOpenWith = 'http://' + config.root_ip + ':' + config.root_port;

	function fileUpload( param ) {
		document.getElementById('submit_btn').setAttribute('style', 'display:visible;');
		document.getElementById('analysis_btn').setAttribute('style', 'display:visible;');
		let url_list_array_ = [];
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
				url_list_array_  = url_list_string.split('\n');
				fileUploadAjax(url_list_array_);
			};
		}
	}	

	function fileUploadAjax(url_list_array_){
		var data = {};
		data.url_list = url_list_array_;
		data.user_id = USER_ID;
		fetch('http://'+config.root_ip+':'+config.root_port+'/rtech/api/post_file', {
			body: JSON.stringify(data),
			headers: {
				'content-type': 'application/json' 
			},
			method: 'POST'
		})
		.then(response => response.json())
		.then(res => {
			if(res.status == 200){
				url_list_array = res.file_content.split('\r\n');
				flag = res.config_exist 							// true or false
				extracted_host_name = res.extracted_host_name;  	// domain name eg- http://google.co.in
				process_host_name = res.process_host_name;  		// domain name eg- google_co_in
				proceedWithUrls();
			}else{
				showMsg('error', 'Something going wrong refresh the window');
				document.getElementById('submit_btn').setAttribute('disabled', 'true');
				document.getElementById('analysis_btn').setAttribute('disabled', 'true');
			}
		})
		.catch(() => {
			showMsg('error', 'Somthing going wrong refresh the window');
			document.getElementById('submit_btn').setAttribute('disabled', 'true');
			document.getElementById('analysis_btn').setAttribute('disabled', 'true');
		})
	}

	function  proceedWithUrls(){
		console.log(url_list_array);
		if ( url_list_array.length > 0 ) {
			url_post_part   = url_list_array[0].replace(extracted_host_name, '');
			proceedForParsing(flag, process_host_name, url_post_part);
		}
		else{
			showMsg('error', 'Something going wrong refresh the page.');
		}
	}

	$('#file_upload').change(function(evt){
		document.getElementById('label_file_upload').innerText = evt.target.files[0].name;
		if ( document.getElementById('file_upload').files[0] ) {
			$('#submit_btn').prop('disabled', false);
			$('#analysis_btn').prop('disabled', false);
		}else{
			$('#submit_btn').prop('disabled', true);
			$('#analysis_btn').prop('disabled', true);
		}
	});

	$('#text_input_urls').bind('input propertychange', function() {
		if( $('#text_input_urls').val().length > 0 ){
			$('#submit_btn').prop('disabled', false);
			$('#analysis_btn').prop('disabled', false);
		}else{
			$('#submit_btn').prop('disabled', true);
			$('#analysis_btn').prop('disabled', true);
		}
	});

	//function called on clicking submit button
	$('#submit_btn').click(function(evt){
		evt.preventDefault();
		$('#file_analyze').prop('checked', false);
		if( $('#text_input_urls').val().length > 0 ){
			fileUpload('textarea');
		}else{
			if ( document.getElementById('file_upload').files[0] ) {
				fileUpload('file');
			}
		}
	});

	//function called on clicking analysis button
	$('#analysis_btn').click(function(evt){
		evt.preventDefault();
		$('#file_analyze').prop('checked', true);
		if( $('#text_input_urls').val().length > 0 ){
			fileUpload('textarea');
		}else{
			if ( document.getElementById('file_upload').files[0] ) {
				fileUpload('file');
			}
		}
	});

	//calling function for opening link in browsers
	function proceedForParsing (flag, process_host_name, url_post_part) {
		argument_analyze_ = document.getElementById('file_analyze').checked;
		//from here we'll divide all the URLs into batches to be executed
		if(flag && !argument_analyze_){
			//case: config exists and we have to only scrape data

			if(document.getElementById('is_debug').checked){
				$('#debuggerContainer').show();
				$('#fileUploadContainer').hide();
			}
			else{
				document.getElementById('progress_bar').style['display'] = 'block';	
			}
			
			//eg {process_host_name: 'www_gnc_com', extracted_host_name: 'http://www.gnc.com'}
			let data = {
				process_host_name: process_host_name,
				extracted_host_name: extracted_host_name,
				user_id: USER_ID
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
				setFetchingStatus();
				check_scraping_status();
			});
		}else if(argument_analyze_){
			//case: analysis has been requested
			let url_ = windowOpenWith + url_post_part.replace(/\;/g,'');
			if(url_.indexOf('?') > -1){
				var str = url_+'&config=false'+'&host='+process_host_name+'&uid='+USER_ID+'&analyze=true';
				window.open(str,'_blank');
			}else{
				var str = url_+'?config=false'+'&host='+process_host_name+'&uid='+USER_ID+'&analyze=true';
				window.open(str,'_blank');
			}
		}else{
			//case: config doesn't exists and we have to create one
			let url_ = windowOpenWith + url_post_part;
			if(url_.indexOf('?') > -1){
				var str = url_+'&config='+flag+'&host='+process_host_name+'&uid='+USER_ID;
				window.open(str,'_blank');
			}else{
				var str = url_+'?config='+flag+'&host='+process_host_name+'&uid='+USER_ID;
				window.open(str,'_blank');
			}
		}
	}

	//function which'll check the status of scraping every 10 seconds. If scrapping completed successfully, it removes the loader and overlay from screen
	function check_scraping_status(){
		var data ={};
		data.user_id = USER_ID;
		data.host_name = process_host_name;
		var myInterval = setInterval(() => {
			fetch('http://'+ config.root_ip + ':' + config.root_port +'/rtech/api/check_scrape', {
				body: JSON.stringify(data),
				headers: {
					'content-type': 'application/json' 
				},
				method: 'POST'
			})
			.then(response => response.json())
			.then(res => {
				if( res.hasOwnProperty('logs') && res.logs.length > 0){
					refreshConsoleLog(0, res.logs);
				}

				if(res.status === 200){
					var html = "";
					if(res.hasOwnProperty('data') && res.data.length > 0){
						parsedJson = res.data;
				 		html = "<table class='table table-bordered table-striped capitalised'>"
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
						$('#fileResponseContainerData').html( '<h4 class="no-data">No data found</h4>' );
					}
					document.getElementById('progress_bar').style['display'] = 'none';
					clearInterval(myInterval);
				}                
			});
		}, 1000)
	}
 	
 	// type - success | errror
 	// msg - a message in string form want to show 
 	// duration - adjust the duration of message shown
 	function showMsg( type, msg, duration = 5000 ){
 		$('#msgBox').show();
 		$('#msgBox').addClass(type);
 		$('#msgBoxMessage').html(msg);
 		setTimeout(function(){ 
 			$('#msgBox').fadeOut();
 			$('#msgBox').removeClass(type);
 		}, duration);
 	}
    
    function setFetchingStatus(){
    	$("#debugger_console").append("<p> Fetching ... </p>");
    }

    function setScrolling(){
		var height = $('#debugger_console')[0].scrollHeight;
		var scrollAmount = height;
		jQuery('#debugger_console').animate({
			scrollTop: height,
		}, 10);
	}
    
	function refreshConsoleLog(i, data_arr){
		var data = data_arr;
		$("#debugger_console").append("<p>" + data[i] + "</p>");
		setScrolling();
		if (i < (data.length - 1)) {
			setTimeout(function(){ 
				i++;
				refreshConsoleLog(i, data);
			}, 100);
		}
	}
});