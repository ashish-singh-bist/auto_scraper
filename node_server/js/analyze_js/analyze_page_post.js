document.body.className += ' ' + 'page-loading';
if ( url_post_part_.slice(-1) == '/')
    url_post_part_ = url_post_part_.replace(/\/$/, "");

if( url_post_part_ && url_post_part_.indexOf('?') > -1){
    url_ = 'http://' + root_ip + ':' + root_port + url_post_part_ +'&host=' + host_ + '&uid=' + uid_ + '&analyze=true';
    console.log('1 - ', url_);
    document.getElementById('analyze_page').src= url_;
}
else{
    url_ = 'http://' + root_ip + ':' + root_port + url_post_part_ +'?host=' + host_ + '&uid=' + uid_ + '&analyze=true';
    console.log('2 - ', url_);
    document.getElementById('analyze_page').src= url_;
}