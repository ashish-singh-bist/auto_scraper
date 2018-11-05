<?php

namespace App\Http\Controllers;

//use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;
use Request;
use LRedis;
use App\Chat;
use Carbon\Carbon;

class ChatController extends Controller
{
	public function __construct()
	{
		// $this->middleware('Auth');
	}

	public function sendMessage(){
		$redis = LRedis::connection();
		
		$data = ['message' => Request::input('message'), 'user' => Request::input('user'), 'user_id' => Request::input('user_id'), 'receiver_id'=>Request::input('receiver_id'), 'is_default' =>Request::input('is_default')];		
		$redis->publish('message', json_encode($data));

		$sender_id = $data['user_id'];
		$receiver_id = $data['receiver_id'];
		$message = $data['message'];
		$created_time = Carbon::now();
		if($data['is_default'] == 'false'){
			Chat::create([ 'sender_id' => $sender_id, 'receiver_id'=> $receiver_id, 'message'=> $message, 'created_time'=> $created_time]);
		}
		return response()->json(['msg'=>'message publish successfully']);
	}

	public function chatHistory()
	{
		$data = ['sender_id'=>Request::input('sender_id'), 'receiver_id' => Request::input('receiver_id')];

		$sender_id = $data['sender_id'];
		$receiver_id = $data['receiver_id'];

		$chat_history = Chat::select('_id', 'sender_id', 'receiver_id', 'message', 'created_time')
						->where(function($query) use ($sender_id,$receiver_id){
							$query->where('sender_id',$sender_id)->where('receiver_id',$receiver_id);
						})->orWhere(function($query) use ($sender_id,$receiver_id){
							$query->where('sender_id',$receiver_id)->where('receiver_id',$sender_id);
						})->get();
		return response()->json($chat_history);
	}
}