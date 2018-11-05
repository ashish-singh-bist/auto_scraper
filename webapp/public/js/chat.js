$(document).ready(function(){
    $("body").append('<script src="//code.jquery.com/jquery-1.11.2.min.js"></script><script src="//code.jquery.com/jquery-migrate-1.2.1.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script><div class="chat-widget"> <meta charset="UTF-8"><script type="text/javascript">$(document).ready(function(){$(".cw-leave-msg").click(function(){$(".cw-leave-msg").hide(); $(".messenger_main").show();}); $(".chat-close-btn").click(function(){$(".cw-leave-msg").show(); $(".messenger_main").hide();});}); </script> <div class="cw-leave-msg-box"> <div class="cw-leave-msg">Leave Us Message</div></div><div class="messenger_main"> <div class="widget2-header">Need Assistance ? <span class="chat-close-btn"><i class="fa fa-times" aria-hidden="true"></i></span></div><div class="chat-messages"> <ul id="userchats"></ul> </div><div class="chat-bottom"> <div class="chat-bottom-div"> <div class="chat-bottom-inner-div"> <textarea class="chat-messages-input" spellcheck="true" name=""></textarea> </div></div></div></div></div>');
});

$(document).ready(function(){
    //-- Adding CSRF Token to header --//
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    var receiver_id = 0;  //no receiver_id selected yet
    var token = $('meta[name="csrf-token"]').attr('content');
    var connection_string = config.root_ip + ":"+config.root_port+"/";
    var socket;
    $(document.body).on('click', '.cw-leave-msg' ,function(){
        //-- create socket.io connection with node server --//
        
        socket = io.connect(connection_string, {query: {user_id : user_id, name: name} });
        if(socket)
        {
            //-- emit username to the server --//
            socket.emit('set_client_name', name);
            $( "#userchats" ).empty();
            $(".chat-messages-input").val('');
            $(".chat-messages-input").prop('disabled', true);
            if(receiver_id ==0 && $('#userchats li').length == 0){
                $( "#userchats" ).append("<li><p>Hello "+name+", connecting to the support team</p></li>");
            }

            //-- Receive data from node server and append it in client window chat box --//
            socket.on('message', function (data) {
                $(".chat-messages-input").prop('disabled', false);
                receiver_id = data.user_id;
                $('.chat-messages').animate({ scrollTop: $('.chat-messages')[0].scrollHeight }, 200);
                if(data.user_id==0){
                    socket.disconnect();
                    $( "#userchats" ).append( "<li class='incoming_msg'><strong>"+data.msg+"</li>" );
                    $(".chat-messages-input").val('');
                    $(".chat-messages-input").prop('disabled', false);
                }else{
                    $( "#userchats" ).append( "<li class='incoming_msg'><strong>"+data.user+"</strong><p>"+data.msg+"</p></li>" );
                    $(".chat-messages-input").val('');
                    $(".chat-messages-input").prop('disabled', false);
                }
            });
        }
        else{
            console.log("connection failed");
        }
    });

    $(document.body).on('click', '.chat-close-btn' ,function(){
         socket.disconnect();
    });

    $('.chat-messages-input').keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
            event.preventDefault();
            var token = $('meta[name="csrf-token"]').attr('content');
            var msg = $(".chat-messages-input").val();
            var is_default =false;
            var data = {'message':msg,'user':name,'user_id':user_id,'receiver_id':receiver_id,'is_default':is_default};
            sendMessageToReceiver(data,token);
            $( "#userchats" ).append( "<li class='outgoing_msg'><strong>me</strong><p>"+msg+"</p></li>" );
            $('.chat-messages').animate({ scrollTop: $('.chat-messages')[0].scrollHeight }, 200);
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