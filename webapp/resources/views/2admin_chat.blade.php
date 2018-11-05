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

<div class="admin-chat-panel">
    <div class="admin-chat-box clearfix">
        <div class="row">
            <div class="col-sm-4 col-sm-4 people-box">
                <div class="people-list" id="people-list">
                    <div class="search">
                        <input type="text" placeholder="Search" />
                        <i class="fa fa-search"></i>
                    </div>
                    <ul class="list" id="onlineusers">
                        
                    </ul>
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
                    </div>
                    <div class="chat-history">
                        <ul>
                            <li class="clearfix">
                                <div class="message-data align-right">
                                    <span class="message-data-time" >10:10 AM, Today</span> &nbsp; &nbsp;
                                    <span class="message-data-name" >Olia</span> <i class="fa fa-circle me"></i>
                                </div>
                                <div class="message other-message float-right">
                                    Hi Vincent, how are you? How is the project coming along?
                                </div>
                            </li>
                            <li>
                                <div class="message-data">
                                    <span class="message-data-name"><i class="fa fa-circle online"></i> Vincent</span>
                                    <span class="message-data-time">10:20 AM, Today</span>
                                </div>
                                <div class="message my-message">
                                    Actually everything was fine. I'm very excited to show this to our team.
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div class="chat-message clearfix">
                        <textarea name="message-to-send" id="message-to-send" placeholder ="Type your message" rows="3"></textarea>
                        <button>Send</button>
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