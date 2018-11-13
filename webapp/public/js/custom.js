function showMsg( type, msg, duration = 5000 ){
    $('#msgBox').show();
    $('#msgBox').addClass(type);
    $('#msgBoxMessage').html(msg);
    setTimeout(function(){ 
        $('#msgBox').fadeOut();
        $('#msgBox').removeClass(type);
    }, duration);
}