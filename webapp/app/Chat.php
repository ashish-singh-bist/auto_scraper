<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Jenssegers\Mongodb\Eloquent\Model as Eloquent;

class Chat extends Eloquent
{
	protected $connection = 'mongodb';
    protected $collection = 'chat_details';
    protected $primaryKey = '_id';
    
    protected $fillable = [
        'sender_id', 'receiver_id', 'message', 'created_time'
    ];
}
