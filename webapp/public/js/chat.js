$(document).ready(function(){
    $("body").append('<script src="//code.jquery.com/jquery-1.11.2.min.js"></script><script src="//code.jquery.com/jquery-migrate-1.2.1.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script><div class="chat-widget"> <meta charset="UTF-8"> <style type="text/css"> @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"); .chat-messages{height: 255px; overflow-x: hidden; overflow-y: auto; text-align: left !important; width: 100%;}.chat-bottom{float: left; height: 98px; width: 100%;}.chat-bottom-div{padding: 0 25px;}.chat-messages-input{background-color: #f4f4f4; border-radius: 5px; border: 0; height: 48px; padding: 2px 14px 2px 10px; resize: none; width: 100%;}.chat-bottom-inner-div{background: #f4f4f4; border-radius: 5px; border: 1px solid; padding: 1px;}.chat-messages ul{float: left; margin-left: 0; margin-top: 10px; padding-left: 0; width: 100%;}.chat-messages ul li{border-bottom: 1px dotted #D7D7D7; float: left; list-style: none outside none; padding-bottom: 10px; padding-left: 10px; width: 100%;}.message{color: #3C3A3B; float: left; margin-bottom: 5px; margin-top: 5px; overflow-x: hidden; width: 100%; word-wrap: break-word;}.messenger_main{display: none; background-color: #fff; border-left: 1px solid #bfbfbf; border-right: 1px solid #bfbfbf; bottom: 0; float: left; height: 350px; position: fixed; right: 5px; width: 300px; z-index: 10000000;}.cw-leave-msg-box{bottom: 0; position: fixed; right: 5px; cursor: pointer; z-index: 1000000000;}.cw-leave-msg{background-color: #727272 !important; border-color: #f5f5f5 !important; color: #FFFFFF !important; font-size: 16px !important; font-family: Courier New, monospace; min-width: 210px; text-align: center; line-height: 2 !important; border-top-left-radius: 7px; border-top-right-radius: 7px;}.widget2-header{line-height: 2 !important; font-size: 17px; background-color: #727272 !important; text-align: center; color: white;}.chat-close-btn{float: right; padding-right: 15px;}</style> <script type="text/javascript">$(document).ready(function(){$(".cw-leave-msg").click(function(){$(".cw-leave-msg").hide(); $(".messenger_main").show();}); $(".chat-close-btn").click(function(){$(".cw-leave-msg").show(); $(".messenger_main").hide();});}); </script> <div class="cw-leave-msg-box"> <div class="cw-leave-msg">Leave Us Message</div></div><div class="messenger_main"> <div class="widget2-header">Need Assistance ? <span class="chat-close-btn"><i class="fa fa-times" aria-hidden="true"></i></span></div><div class="chat-messages"> <ul id="userchats"></ul> </div><div class="chat-bottom"> <div class="chat-bottom-div"> <div class="chat-bottom-inner-div"> <textarea class="chat-messages-input" spellcheck="true" name=""></textarea> </div></div></div></div></div>');
});

$(document).ready(function(){
	//-- Adding CSRF Token to header --//
	$.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });
    console.log($('meta[name="csrf-token"]').attr('content'));

    var receiver_id = 0;
    $(document.body).on('click', '.cw-leave-msg' ,function(){
		//-- create socket.io connection with node server --//
        var token = $('meta[name="csrf-token"]').attr('content');
		var connection_string = config.root_ip + ":"+config.chat_port+"/";
        var socket = io.connect(connection_string, {query: {user_id : user_id, username: user_name} });
        if(socket)
        {
        	if(receiver_id ==0 && $('#userchats li').length == 0){
        		$( "#userchats" ).append("<li><p>Hello "+user_name+", How Can I Assist You?</p></li>");
        	}
        	
        	//-- emit username to the server --//
            socket.emit('client_name', user_name);

            // Sending Default message to the admin

            // var msg="user want to communicate with you.";
            // var data = {'message':msg,'user':user_name,'user_id':receiver_id};            
            // sendMessageToReceiver(data);
            // $( "#userchats" ).append( "<li><strong>"+user_name+" :</strong><p>"+msg+"</p></li>" );

            //-- Receive data from node server and append it in client window chat box --//
            socket.on('message', function (data) {
                receiver_id = data.user_id;
                $( "#userchats" ).append( "<li><strong>"+data.user+" :</strong><p>"+data.msg+"</p></li>" );
            });
        }
        else{
            console.log("connection failed");
        }
    });

    $('.chat-messages-input').keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
    		event.preventDefault();
            var token = $('meta[name="csrf-token"]').attr('content');
	        var msg = $(".chat-messages-input").val();
	        var data = {'message':msg,'user':user_name,'receiver_id':receiver_id};
	        sendMessageToReceiver(data,token);
	        $( "#userchats" ).append( "<li><strong>"+user_name+" :</strong><p>"+msg+"</p></li>" );
	    }
	});

    function sendMessageToReceiver(data,token){
        data._token = token;
        if(data.msg != '' || data.msg !=null){
            $.ajax({
                type: "POST",
                url: chat_post_url,
                dataType: "json",
                data: data,
                success:function(data){
                    $(".chat-messages-input").val('');
                    console.log("this is success msg");
                },
                error: function(error) {
                    console.log("this is error msg");
                    console.log(error);
                }
            });
        } else{
            alert("Please Add Message.");
        }
    }
});