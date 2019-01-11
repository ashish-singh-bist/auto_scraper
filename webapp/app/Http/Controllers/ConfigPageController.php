<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Yajra\Datatables\Datatables;
use GuzzleHttp\Client;

class ConfigPageController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function getPage(Request $request)
    {
        $iframe_url = $request->url;
        // dd($iframe_url);
        // $iframe_url = "https://www.youtube.com/watch?v=8ULXqEx6KQc";
        return view('config_page', [ 'iframe_url' => $iframe_url ]);
        // return view('config_page', [ 'iframe_url' => 'http://192.168.1.117:6500/YouTube.html' ]);
    }
    public function getPageFrame(Request $request)
    {
        $iframe_url = $request->url;
        print_r($iframe_url);
        $client = new Client([
            'base_uri' => ''
        ]);


        $res = $client->request('GET', $iframe_url);
        print($res->getBody());
        // print_r("<br>hello <h1>QWERTY</h1>");
        
    }
}