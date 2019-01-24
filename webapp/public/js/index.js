$( document ).ready(function(){
	$('#file_upload').val('');
	$('#text_input_urls').val('');
	$('#is_debug').prop('checked', true);
	$('.parse-btn').prop('disabled', true);

	//declaring reqired variables
	var url_list_array = [], parsedJson = [];
	var extracted_host_name, flag, process_host_name, argument_analyze_, url_post_part, actual_url;
	var windowOpenWith = 'http://' + config.root_ip + ':' + config.root_port;

	function removeSpaces(input_url){
		var url_array  = input_url.split('\n');
		var filter_urls_array = [];
		var filter_str = '';
		for (key in url_array) {
			filter_str = url_array[key].replace(/\s+/g, '');
			if (filter_str){
				filter_urls_array.push(filter_str);}
		}
		return filter_urls_array;

		// regex solution for filter url, regex solution increase the responce time of removeSpaces()
		// var url_array = input_url;
		// url_array = url_array.replace(/(^\s*)|(\s*$)/gi,"");
		// url_array = url_array.replace(/[ ]{0,}/gi,"");
		// url_array = url_array.replace(/\t+/g,"");
		// url_array = url_array.replace(/\n+/g,"\n");
		// url_array = url_array.split('\n');
		// return url_array;
	}

	function fileUpload( param ) {
		$('#progress_bar').show();
		let url_list_array_ = [];
		if( param == 'textarea'){
			let input_url = document.getElementById('text_input_urls').value;
			url_list_array_ = removeSpaces(input_url);
			// console.log(url_list_array_);
			fileUploadAjax(url_list_array_);
		}else{
			let file = document.getElementById('file_upload').files[0];
			let reader = new FileReader();
			reader.readAsText(file);
			reader.onload = function(event) {
				url_list_string = event.target.result;
				url_list_array_ = removeSpaces(url_list_string);
				// console.log(url_list_array_);
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
				$('#progress_bar').hide();
				url_list_array = res.file_content.split('\r\n');
				flag = res.config_exist 							// true or false
				extracted_host_name = res.extracted_host_name;  	// domain name eg- http://google.co.in
				process_host_name = res.process_host_name;  		// domain name eg- google_co_in
				actual_url = res.actual_url;
				proceedWithUrls();
			}else{
				showMsg('error', 'Something going wrong refresh the window');
				$('.parse-btn').prop('disabled', true);
			}
		})
		.catch(() => {
			showMsg('error', 'Somthing going wrong refresh the window');
			$('.parse-btn').prop('disabled', true);
		})
	}

	function  proceedWithUrls(){
		console.log(url_list_array);
		if ( url_list_array.length > 0 ) {
			url_post_part   = url_list_array[0].replace(extracted_host_name, '');
			proceedForParsing();
		}
		else{
			showMsg('error', 'Something going wrong refresh the page.');
		}
	}

	$('#file_upload').change(function(evt){
		$('#label_file_upload').html(evt.target.files[0].name);
		if ( document.getElementById('file_upload').files[0] ) {
			$('.parse-btn').prop('disabled', false);
		}else{
			$('.parse-btn').prop('disabled', true);
		}
	});

	$('#text_input_urls').bind('input propertychange', function() {
		if( $('#text_input_urls').val().length > 0 ){
			$('.parse-btn').prop('disabled', false);
		}else{
			$('.parse-btn').prop('disabled', true);
		}
	});

	//function called on clicking submit button
	$('#submit_btn').click(function(evt){
		evt.preventDefault();
		argument_analyze_ = false;
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
		argument_analyze_ = true;
		if( $('#text_input_urls').val().length > 0 ){
			fileUpload('textarea');
		}else{
			if ( document.getElementById('file_upload').files[0] ) {
				fileUpload('file');
			}
		}
	});

	function proceedForScraping(){
		if(document.getElementById('is_debug').checked){
				$('#debuggerContainer').show();
				$('#fileUploadContainer').hide();
		}
		else{
			$('#progress_bar').show();
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
			setFetchingStatus();		// add initial message in debugger window ex- "Fetching ..."
			check_scraping_status();
		});
	}

	
	function proceedForAnalysis(){
		var split_url_arr = extracted_host_name.split('/');
		let url_ = windowOpenWith;
		var str = url_+'?config=false'+'&host='+process_host_name+'&uid='+USER_ID+'&analyze=true';
		window.open(str,'_blank');
	}

	function proceedForConfig(editmode = false){
		var split_url_arr = extracted_host_name.split('/');
		let url_ = windowOpenWith;
		url_post_part = url_post_part.replace(/\/\/+/g, '/');
		var str = url_+'/config?config='+flag+'&host='+process_host_name+'&uid='+USER_ID+'&url_post_part='+encodeURIComponent(url_post_part);
		window.open(str,'_blank');
	}

	//calling function for opening link in browsers
	function proceedForParsing () {
		//from here we'll divide all the URLs into batches to be executed
		if(argument_analyze_){
			proceedForAnalysis();			//case: analysis has been requested
		}else if(flag ){
			$.confirm({
				closeIcon: true,
				icon: 'fa fa-warning',
				title: 'Edit Config Confirm!',
				content: 'Do you want edit config file ?',
				columnClass: 'col-md-5 col-md-offset-4',
				buttons: {
					editConfig: {
						text: 'Yes!',
						btnClass: 'btn-warning',
						action: function(){
							proceedForConfig(true);		//case: config exists and we have to edit config
						}
					},
					ContinueParsing: {
						text: 'Continue Parsing!',
						btnClass: 'btn-success',
						action: function(){
							proceedForScraping();		//case: config exists and we have to only scrape data
						}
					}
				}
			});
		}else{
			proceedForConfig();				//case: config doesn't exists and we have to create one
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

				 		var key_array = [];
				 		//insert key in array for table header
						parsedJson.forEach(function (obj, index) {
							for (var key in obj) {
								if (obj.hasOwnProperty(key) && $.inArray(key, key_array) == -1)
									key_array.push(key);
							}
						});

						//create table header
						html += "<tr>";
						for(var i=0; i< key_array.length; i++) {
							html += "<th>" + key_array[i] + "</th>";
						}
						html += "</tr>";

						//create table data
						parsedJson.forEach(function (obj, index) {					
							html += "<tr>";
							for(var i=0; i< key_array.length; i++) {
								key = key_array[i];
								if (obj.hasOwnProperty(key)){
									if( key == 'url' ){
										var trim_title = obj[key];
										if (trim_title.length > 29 ){
											trim_title = trim_title.substring(0, 28)+"...";
										}											
										html += "<td><a target='blank' href='http://" + obj[key] + "'>" + trim_title + "</a></td>";																				
									}
									else{
										if (  typeof(obj[key]) == 'object'){
											html += "<td>" + JSON.stringify(obj[key]) + "</td>";
										}
										else{
											html += "<td>" + obj[key] + "</td>";
										}
										
									}
								}else{
									html += "<td></td>";
								}
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
					$('#progress_bar').hide();
					clearInterval(myInterval);
				}                
			});
		}, 1000)
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