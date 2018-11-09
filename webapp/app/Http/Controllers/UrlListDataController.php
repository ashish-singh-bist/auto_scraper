<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Yajra\Datatables\Datatables;
use App\UrlListData;

class UrlListDataController extends Controller
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
    public function index(request $request)
    {
        return view('url_list_data');
    }

    public function getData()
    {
        $id = Auth::user()->id;
        $url_list_data = UrlListData::where('user_id', $id)->limit(100)->get();
        return Datatables::of($url_list_data)->make(true);
    }
}
