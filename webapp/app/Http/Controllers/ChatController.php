<?php

namespace App\Http\Controllers;

//use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;
use Request;
use LRedis;

class ChatController extends Controller
{
	public function __construct()
	{
		// $this->middleware('Auth');
	}

	public function sendMessage(){
		$redis = LRedis::connection();
		$data = ['message' => Request::input('message'), 'user' => Request::input('user'), 'user_id' => Request::input('user_id'), 'receiver_id'=>Request::input('receiver_id')];		
		$redis->publish('message', json_encode($data));
		return response()->json(['msg'=>'message publish successfully']);
	}
}	
