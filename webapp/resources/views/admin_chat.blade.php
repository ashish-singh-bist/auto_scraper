@extends('adminlte::page')

@section('title', 'AdminLTE')

@section('content_header')
    <h4>Chat Message Module</h4>
@stop

@section('content')
<!-- <script src="//code.jquery.com/jquery-1.11.2.min.js"></script> -->
<script src="//code.jquery.com/jquery-migrate-1.2.1.min.js"></script>
<!-- <script src="https://cdn.socket.io/socket.io-1.3.4.js"></script> -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>

<div class="admin-chat-panel">
    <div class="admin-chat-box clearfix">
        <div class="row">
            <div class="col-sm-4 col-sm-4 people-box">
                <div class="people-list" id="people-list">
                    <div class="search">
                        <input type="text" placeholder="Search" />
                        <i class="fa fa-search"></i>
                    </div>
                    <ul class="list" id="onlineusers"></ul>
                </div>
            </div>
            <div class="col-sm-8 col-sm-8 chat-box">
                <div class="chat">
                    <div class="chat-header clearfix">
                        <img src="/img/avatar.png" alt="avatar" />
                        <div class="chat-about">
                            <div class="chat-with"></div>
                            {{-- <div class="chat-num-messages">already 1 902 messages</div> --}}
                        </div>
                        <i class="fa fa-chain-broken disconnect-user" aria-hidden="true" title="Disconnect user"></i>
                    </div>
                    <div class="chat-history">
                        <ul id="messages"></ul>
                    </div>
                    <div class="chat-message clearfix">
                        <textarea name="message-to-send" class="msg" id="message-to-send" placeholder ="Type your message" rows="3"></textarea>
                        <button class="btn btn-success send-msg">Send</button>
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