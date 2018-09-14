$(document).ready(function(){
    // Add CSRF Token 
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    var receiver_id = 0;
    var previous_receiver_id = 0;
    var connection_string = config.root_ip + ":"+config.root_port+"/";
    var socket = io.connect(connection_string, {query: {user_id : user_id, name: name} });
    
    socket.emit('set_client_name', name);

    socket.on('message', function (data) {
        $( "#messages" ).append( "<li><strong>"+data.user+" :</strong><p>"+data.msg+"</p></li>" );
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
                        active_class = "btn-warning";
                    }
                    else {
                        active_class = "btn-primary";
                    }

                    $("#onlineusers").append("<li class='online_users'><button class='btn " + active_class + " user_list' ref_name='"+data.users[i]['name']+"' id='"+data.users[i]['user_id']+"'><i class='fa fa-circle' aria-hidden='true' style='font-size:11px;color:#0af90a;margin:5px;'></i>"+data.users[i]['name']+"</button></li>");

                }
            }
        }
    });

    $(document.body).on('click', '.user_list' ,function(){
        var token = $('meta[name="csrf-token"]').attr('content');
        $(".msg").val('');
        $("#messages").empty();
        receiver_id = $(this).attr('id');
        // if(receiver_id!=previous_receiver_id){
        //     if(previous_receiver_id!=0){
        //         // var msg = 'Please wait to reconnect to our support team.';
        //         // var data = {'message':msg,'user':name,'user_id':user_id,'receiver_id':previous_receiver_id};
        //         // sendMessageToReceiver(data,token);
        //     }
        //     previous_receiver_id = receiver_id;
        // }
        var receiver_name = $(this).attr('ref_name');
        $("#messages").append( "<li><strong>"+receiver_name+" :</strong> connected</li>" );
       
        var msg = 'Hello '+receiver_name+', How can i assist you?'
        var data = {'message':msg,'user':name,'user_id':user_id,'receiver_id':receiver_id};
        sendMessageToReceiver(data,token);
    });

    $(".send-msg").click(function(e){
        var token = $('meta[name="csrf-token"]').attr('content');
        var msg = $(".msg").val();
        if(receiver_id!=0){
            var data = {'message':msg,'user':name,'user_id':user_id,'receiver_id':receiver_id};
            sendMessageToReceiver(data,token);
            $("#messages").append( "<li><strong>me :</strong><p>"+msg+"</p></li>" );
        }
    });

    $(".disconnect-user").click(function(e){
        var token = $('meta[name="csrf-token"]').attr('content');
        var msg = "Thank you for your time. Incase any troble, feel free to contact us. Our support team will reach out to you via email.<a href='#' class='btn btn-info cw-leave-msg'>click to reconnect</a>";
        var data = {'message':msg,'user':name,'user_id':0,'receiver_id':receiver_id};
        sendMessageToReceiver(data,token);
        $(".msg").val('');
        $("#messages").empty();
        receiver_id = 0;
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