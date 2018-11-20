// url_list_data.blade.php js code

$( document ).ready(function(){
    $("#url_source").val("");
    $('#scraping_for_url_list').prop('disabled', true);

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
            fetch('http://'+ config.root_ip + ':' + config.root_port +'/rtech/api/scrape_pages', {
                body: JSON.stringify(data),
                headers: { 'content-type': 'application/json' },
                method: 'POST'
            })
            .then(response => response.json())
            .then(res => {
                if( res.hasOwnProperty('config_exist') && res.status == 200 && res.config_exist == false && res.hasOwnProperty('url') && res.url ){
                    $.confirm({
                        closeIcon: true,
                        icon: 'fa fa-warning',
                        title: 'Config not exist For this domain!',
                        content: 'Make config file ?',
                        columnClass: 'col-md-5 col-md-offset-4',
                        buttons: {
                            makeConfig: {
                                text: 'Yes!',
                                btnClass: 'btn-success',
                                action: function(){
                                    proceedForConfig(res.url);     //case: config not exists and we have to make config
                                }
                            }
                        }
                    });
                }
                else if( res.hasOwnProperty('no_data') && res.no_data && res.status == 200){
                    showMsg('success', res.message);
                }
                else{
                    showMsg('error', 'Something going wrong refresh the window');
                }
            }).catch((e) => {
                console.log(e);
                showMsg('error', 'Somthing going wrong refresh the window ');
            })
        }
    });

});

function proceedForConfig( url_ ){
    // alert(url_)

    var windowOpenWith          = 'http://' + config.root_ip + ':' + config.root_port;
    var split_ar                = url_.split('/');
    var extracted_host_name     = split_ar[0] + '//' + split_ar[2];            // domain name eg- http://google.co.in
    var process_host_name       = (url_.split('/'))[2].replace(/\./g,'_');    // domain name eg- google_co_in
    var url_post_part           = url_.replace(extracted_host_name, '');

    let _url = windowOpenWith + url_post_part;
    if(_url.indexOf('?') > -1){
        var str = _url+'&config=false&editmode=false&host='+process_host_name+'&uid='+USER_ID;
        window.open(str,'_blank');
    }else{
        var str = _url+'?config=false&editmode=false&host='+process_host_name+'&uid='+USER_ID;
        window.open(str,'_blank');
    }
}