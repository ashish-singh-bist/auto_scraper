function myFunction(){
    $('iframe').contents().hover(function(){
        //Do whatever you need
        // console.log($(this).text());
        console.log($(this));
        $(this).attr('style','color:red;');
    });
    alert('hello');
}