@extends('adminlte::page')

@section('title', 'AdminLTE')

@section('content_header')
    <h4>Chat Message Module</h4>
@stop

@section('content')
<style>
    .online_users
    {
        margin:5px;
    }
    .user_list
    {
        width:100%;
        text-align: left;
    }
    .send-msg, .previous-msg, .disconnect-user
    {
        width: 120px;
        margin: 5px;
    }
</style>
<!-- <script src="//code.jquery.com/jquery-1.11.2.min.js"></script> -->
<script src="//code.jquery.com/jquery-migrate-1.2.1.min.js"></script>
<!-- <script src="https://cdn.socket.io/socket.io-1.3.4.js"></script> -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>
<div class="container spark-screen">
    <div class="row">
        <div class="col-md-10 col-md-offset-1">
            <div class="panel panel-default">
                <div class="panel-body">
                <div class="row">
                    <div class="col-sm-3">
                        <h5>Online Users : <span id="counter"></span></h5>
                        <ul id="onlineusers" style="list-style-type: none; border: 1px solid #c3c3c3; padding: 0; margin: 0; "></ul>
                    </div>
                    <div class="col-sm-8" >
                        <div id="user_panel" style="max-height: 150px; overflow-y: scroll;">
                        </div>
                        <div id="message_box">
                            <textarea class="form-control msg"></textarea>
                            <br/>
                            <input type="button" value="Send" class="btn btn-success send-msg">
                            <input type="button" value="View History" class="btn previous-msg">
                            <input type="button" value="Disconnect user" class="btn btn-danger disconnect-user">
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    </div>
</div>

@section('adminlte_js')
<script src="js/admin_chat.js"></script>
@endsection
@stop