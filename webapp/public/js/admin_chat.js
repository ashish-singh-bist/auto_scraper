$(document).ready(function(){
    // Add CSRF Token 
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    var user_chat_panel = [];
    var receiver_id = 0;
    var receiver_name ='';
    var connection_string = config.root_ip + ":"+config.root_port+"/";
    var socket = io.connect(connection_string, {query: {user_id : user_id, name: name} });
    
    socket.emit('set_client_name', name);

    socket.on('message', function (data) {
        if(data.user_id == receiver_id){
            $('#messages').append('<li class="clearfix"><div class="message-data align-right"><span class="message-data-name" >'+data.user+'</span> <i class="fa fa-circle me"></i></div><div class="message other-message float-right">'+data.msg+'</div>');
        }
        else{
            $('#messages').append('<li class="clearfix"><div class="message-data"><span class="message-data-name"><i class="fa fa-circle online"></i>'+data.user+'</span></div><div class="message my-message">'+data.msg+'</div></li>');
        }
        $('.chat-history').animate({ scrollTop: $('.chat-history')[0].scrollHeight }, 200);
    });

    socket.on('get_user_count', function (data) {
        var total_user = data.user_count - 1;
        $("#counter").text(total_user);
    });

    socket.on('get_users',function(data){
        $("#onlineusers").text('');
        if(data.users.length > 0){
            for(i =0; i< data.users.length; i++){
                if(data.users[i]['user_id']!=user_id){
                    var active_class = "";
                    if(receiver_id == data.users[i]['user_id']){
                        $("#onlineusers").append('<li class="clearfix user_list" ref_name="'+data.users[i]['name']+'" id="'+data.users[i]['user_id']+'"><img src="/img/avatar.png" alt="avatar" /><div class="about"><div class="name">'+data.users[i]['name']+'</div><div class="status"><i class="fa fa-circle online"></i> Active</div></div></li>');
                        $('.chat-header').show();
                        $('.chat-with').html(data.users[i]['name']);
                    }
                    else {
                        $("#onlineusers").append('<li class="clearfix user_list" ref_name="'+data.users[i]['name']+'" id="'+data.users[i]['user_id']+'"><img src="/img/avatar.png" alt="avatar" /><div class="about"><div class="name">'+data.users[i]['name']+'</div><div class="status"><i class="fa fa-circle offline"></i> offline</div></div></li>');
                    }
                }
            }
        }
    });

    $(document.body).on('click', '.user_list' ,function(){
        $('#messages').empty();
        var token = $('meta[name="csrf-token"]').attr('content');
        $(".msg").val('');
        receiver_id = $(this).attr('id');                   // client id
        receiver_name = $(this).attr('ref_name');           // client name
        if($.inArray(receiver_id,user_chat_panel) >= 0){
            // $('.chat_panel').hide();
            // $('#chatpanel_'+ receiver_id).show();
        }
        else{
            // $('.chat_panel').hide();
            // $('#user_panel').append("<div id='chatpanel_" + receiver_id + "' class='chat_panel'><ul id='messages'></ul></div>");
            user_chat_panel.push(receiver_id);
            // $('#chatpanel_'+ receiver_id+' #messages').append( "<li><strong>"+receiver_name+" :</strong> connected</li>" );
            var msg = 'Hello '+receiver_name+', How can i assist you?'
            var is_default =true;
            var data = {'message':msg,'user':name,'user_id':user_id,'receiver_id':receiver_id,'is_default':is_default};
            sendMessageToReceiver(data,token);
        }
        if(receiver_id!=0){
            var data = {'sender_id':user_id,'receiver_id':receiver_id};
            data._token = token;
            $.ajax({
                type: "POST",
                url: chat_history_url,
                dataType: "json",
                data: data,
                success:function(data){
                    for(i=0;i<data.length;i++){
                        if(data[i].sender_id == user_id){
                            $('#messages').append('<li class="clearfix"><div class="message-data"><span class="message-data-name"><i class="fa fa-circle online"></i>Me:</span></div><div class="message my-message">'+data[i].message+'</div></li>');
                            // $('#chatpanel_'+ receiver_id+' #messages').append( "<li><strong>me :</strong><p>"+data[i].message+"</p></li>" );    
                            $('.chat-history').animate({ scrollTop: $('.chat-history')[0].scrollHeight }, 1);
                        }
                        else {
                            $('#messages').append('<li class="clearfix"><div class="message-data align-right"><span class="message-data-name" >'+receiver_name+'</span> <i class="fa fa-circle me"></i></div><div class="message other-message float-right">'+data[i].message+'</div>');
                            $('.chat-history').animate({ scrollTop: $('.chat-history')[0].scrollHeight }, 1);
                            // $('#chatpanel_'+ receiver_id+' #messages').append( "<li><strong>"+receiver_name+" :</strong><p>"+data[i].message+"</p></li>" );
                        }
                    }
                    $("#user_panel").scrollTop(data.length * 100);
                    console.log("this is success msg");
                },
                error: function(error) {
                    console.log("this is error msg");
                    console.log(error);
                }
            });
        }
    });

    $(".send-msg").click(function(e){
        var token = $('meta[name="csrf-token"]').attr('content');
        var msg = $(".msg").val();
        if(receiver_id!=0){
            var is_default =false;
            var data = {'message':msg,'user':name,'user_id':user_id,'receiver_id':receiver_id,'is_default':is_default};
            sendMessageToReceiver(data,token);
            $('#messages').append('<li class="clearfix"><div class="message-data"><span class="message-data-name"><i class="fa fa-circle online"></i>Me:</span></div><div class="message my-message">'+msg+'</div></li>');
            $('.chat-history').animate({ scrollTop: $('.chat-history')[0].scrollHeight }, 200);
        }
    });

    $(".previous-msg").click(function(e){
        var token = $('meta[name="csrf-token"]').attr('content');
        if(receiver_id!=0){
            var data = {'sender_id':user_id,'receiver_id':receiver_id};
            data._token = token;
            $.ajax({
                type: "POST",
                url: chat_history_url,
                dataType: "json",
                data: data,
                success:function(data){
                    for(i=0;i<data.length;i++){
                        if(data[i].sender_id == user_id){
                            $('#messages').append('<li class="clearfix"><div class="message-data"><span class="message-data-name"><i class="fa fa-circle online"></i>Me:</span></div><div class="message my-message">'+data[i].message+'</div></li>');
                            // $('#chatpanel_'+ receiver_id+' #messages').append( "<li><strong>me :</strong><p>"+data[i].message+"</p></li>" );    
                            $('.chat-history').animate({ scrollTop: $('.chat-history')[0].scrollHeight }, 1);
                        }
                        else {
                            $('#messages').append('<li class="clearfix"><div class="message-data align-right"><span class="message-data-name" >'+receiver_name+'</span> <i class="fa fa-circle me"></i></div><div class="message other-message float-right">'+data[i].message+'</div>');
                            $('.chat-history').animate({ scrollTop: $('.chat-history')[0].scrollHeight }, 1);
                            // $('#chatpanel_'+ receiver_id+' #messages').append( "<li><strong>"+receiver_name+" :</strong><p>"+data[i].message+"</p></li>" );
                        }
                    }
                    $("#user_panel").scrollTop(data.length * 100);
                    console.log("this is success msg");
                },
                error: function(error) {
                    console.log("this is error msg");
                    console.log(error);
                }
            });
        }
    });

    $(".disconnect-user").click(function(e){
        var token = $('meta[name="csrf-token"]').attr('content');
        var msg = "Thank you for your time. Incase any troble, feel free to contact us. Our support team will reach out to you via email.<a href='#' class='btn btn-info cw-leave-msg'>click to reconnect</a>";
        var is_default = true;
        var data = {'message':msg,'user':name,'user_id':0,'receiver_id':receiver_id,'is_default':is_default};
        sendMessageToReceiver(data,token);
        $(".msg").val('');
        $('#messages').empty();
        receiver_id = 0;
    });

    $('#message-to-send').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            event.preventDefault();
            var token = $('meta[name="csrf-token"]').attr('content');
            var msg = $(".msg").val();
            if(receiver_id!=0){
                var is_default =false;
                var data = {'message':msg,'user':name,'user_id':user_id,'receiver_id':receiver_id,'is_default':is_default};
                sendMessageToReceiver(data,token);
                $('#messages').append('<li class="clearfix"><div class="message-data"><span class="message-data-name"><i class="fa fa-circle online"></i>Me:</span></div><div class="message my-message">'+msg+'</div></li>');
                $('.chat-history').animate({ scrollTop: $('.chat-history')[0].scrollHeight }, 200);
            }
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
                    $(".msg").val('');
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