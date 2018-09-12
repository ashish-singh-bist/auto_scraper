$(document).ready(function(){
    // Add CSRF Token 
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    var receiver_id = 0;
    var connection_string = config.root_ip + ":"+config.chat_port+"/";
    var socket = io.connect(connection_string, {query: {user_id : user_id, username: user_name} });
    
    socket.emit('client_name', user_name);

    socket.on('message', function (data) {
        $( "#messages" ).append( "<li><strong>"+data.user+" :</strong><p>"+data.msg+"</p></li>" );
    });

    socket.on('user_count', function (data) {
        var total_user = data.user_count - 1;
        $("#counter").text(total_user);
    });

    socket.on('users',function(data){
        $("#onlineusers").text('');
        if(data.users.length > 0){
            for(i =0; i< data.users.length; i++){
                console.log(data.users[i].username);
                // if(data.users[i]['user_id']!=user_id){
                //     $("#onlineusers").append("<li class='user_list' id='"+data.users[i]['user_id']+"'><i class='fa fa-circle' aria-hidden='true' style='font-size:11px;color:#0af90a;margin:5px;'></i><a href='#' id='"+data.users[i]['user_id']+"'>"+data.users[i]['username']+"</a></li>");
                // }
            }
        }
    });
    
    $(document.body).on('click', '.user_list' ,function(){
        receiver_id = $(this).attr('id');
        $("input[name='receiverid']").val(receiver_id);
    });

    $(".send-msg").click(function(e){
        e.preventDefault();
        var token = $('meta[name="csrf-token"]').attr('content');
        var msg = $(".msg").val();
        var data = {'message':msg,'user':user_name,'user_id':user_id,'receiver_id':receiver_id};
        sendMessageToReceiver(data,token);
        $( "#messages" ).append( "<li><strong>"+user_name+" :</strong><p>"+msg+"</p></li>" );
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