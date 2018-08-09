<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title>Scraper Project</title>
    <script src="config/config.js"></script>
    
    <!-- Bootstrap -->
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <link href="css/jquery-ui.css" rel="stylesheet">
    <link href="css/from-the-page.css" rel="stylesheet">
    
    <script src="js/jquery-3.3.1.min.js"></script>
    <script src="js/bootstrap.min.js"></script>
</head>
<body>
    <!-- homepage input form -->
    <div id="website-input-form" class="container">
    <center>
    <img width="142" height="142" src="img/ic_open_in_browser_black_48dp_2x.png" />
    
    <form class="form-inline" method="post" id="search_site_form">
    <label for="file-upload" class="custom-file-upload" id="label-file-upload">
    Click to Upload File
    </label>
    <input id="file-upload" type="file" name="file-upload" />
    <button style="display:none;" id="submit-btn" type="submit">Go</button><br>
    <input id="file-analyze" type="checkbox" class="custom-file-upload" name="file-analyze" /> Analyze page traffic?
    </form>
    
    </center>
    
    <?php
        if(isset($_POST['file-upload'])){
            if(isset($_POST['file-analyze'])){
                system('node client.js '.$_POST['file-upload'].' '.$_POST['file-analyze']);
            }else{
                system('node client.js '.$_POST['file-upload']);
            }
        }
    ?>
    </div>
</body>
<script type="text/javascript">
    document.getElementById('file-upload').addEventListener('change', readFile, false);
    document.getElementById('submit-btn').addEventListener('click', submitform, false);

    var url_list_array = [];
    var extracted_host_name, flag, process_host_name, argument_analyze_;
    var windowOpenWith = 'http://' + config.root_ip + ':' + config.root_port;

    function readFile (evt) {
        
        document.getElementById('submit-btn').setAttribute('style', 'display:visible;');
        document.getElementById('label-file-upload').innerText= evt.target.files[0].name;

        var url_list_array_ = [], url_list_string;

        var files = evt.target.files;
        var file = files[0];           
        var reader = new FileReader();
        reader.onload = function(event) {
            url_list_string = event.target.result;
            url_list_array_  = url_list_string.split('\r\n');
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
                    document.getElementById('label-file-upload').style['background-color'] = '#459246';
                    url_list_array = res.file_content.split('\r\n');
                    proceedWithUrls();
                }else{
                    document.getElementById('label-file-upload').style['background-color'] = 'tomato';
                    document.getElementById('submit-btn').setAttribute('disabled', 'true');
                }
            })
            .catch(() => {
                document.getElementById('label-file-upload').style['background-color'] = 'tomato';
                document.getElementById('submit-btn').setAttribute('disabled', 'true');
            })
        }
        reader.readAsText(file);
    }

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

        fetch('http://'+ config.root_ip + ':' + config.root_port +'/rtech/api/check_config', {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json' 
            },
            method: 'POST'
        })
        .then(response => response.json())
        .then(res => {
            flag = res.exists;
            process_host_name = res.extracted_host_name;

        });
    }

    function submitform(evt) {
        evt.preventDefault();
        proceedForParsing(flag, process_host_name, url_list_array);
    }

    //calling function for opening link in browsers
    function proceedForParsing (flag, process_host_name, url_list_array) {
        argument_analyze_ = document.getElementById('file-analyze').checked;
        
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
                                let url_ = windowOpenWith+url_list_array[i].replace(/\;/g,'');
                                var str = url_+'&config='+flag+'&host='+process_host_name ;
                                window.open(str,'_blank');
                            }else{
                                let url_ = windowOpenWith+url_list_array[i].replace(/\;/g,'');
                                var str = url_+'?config='+flag+'&host='+process_host_name ;
                                window.open(str,'_blank');
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
                                let url_ = windowOpenWith+url_list_array[i].replace(/\;/g,'');
                                var str = url_+'&config='+flag+'&host='+process_host_name;
                                window.open(str,'_blank');
                            
                            }else{
                                let url_ = windowOpenWith+url_list_array[i].replace(/\;/g,'');
                                var str = url_+'?config='+flag+'&host='+process_host_name;
                                window.open(str,'_blank');
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
            let url_ = windowOpenWith+url_list_array[0].replace(/\;/g,'');
            if(url_.indexOf('?') > -1){
                var str = url_+'&config=false'+'&host='+process_host_name+'&analyze=true';
                window.open(str,'_blank');
            }else{
                var str = url_+'?config=false'+'&host='+process_host_name+'&analyze=true';
                window.open(str,'_blank');
            }
        }else{
            //case: config doesn't exists and we have to create one
            let url_ = windowOpenWith+url_list_array[0];
            if(url_.indexOf('?') > -1){
                
                var str = url_+'&config='+flag+'&host='+process_host_name;
                window.open(str,'_blank');
            }else{
                var str = url_+'?config='+flag+'&host='+process_host_name;
                window.open(str,'_blank');
            }
        }
    }
</script>
</html>
