$( document ).ready(function(){
     $('#scraping_for_url_list').click(function(evt){

        var option_selected = $( "#url_source option:selected" ).val();
        if ( option_selected ) {
        
            //eg {process_host_name: 'www_gnc_com', extracted_host_name: 'http://www.gnc.com'}
            let data = {
                process_host_name: '',
                extracted_host_name: '',
                source: option_selected,
                user_id: USER_ID
            }
            //POST request which will tell the server to start scraping the URLs from the file uploaded earlier via readFile() method
            console.log(data);
            fetch('http://'+ config.root_ip + ':' + config.root_port +'/rtech/api/scrape_pages', {
             body: JSON.stringify(data),
             headers: {
                 'content-type': 'application/json'
             },
             method: 'POST'
            })
            .then(response => response.json())
            .then(res => {
                console.log('responce');
            });
        }
    });

     $('#url_source').change(function(evt){
        var option_selected = $( "#url_source option:selected" ).val();
        if ( option_selected ) {
            $('#scraping_for_url_list').prop('disabled', false);
        }
        else{
            $('#scraping_for_url_list').prop('disabled', true);
        }
     });
});