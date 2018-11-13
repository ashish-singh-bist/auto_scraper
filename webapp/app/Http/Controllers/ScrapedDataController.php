<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Yajra\Datatables\Datatables;
use App\ScrapedData;

class ScrapedDataController extends Controller
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
        return view('scraped_data');
    }

    public function getData()
    {
        $id = Auth::user()->id;
        $scraped_data = ScrapedData::where('user_id', $id)->get();
        return Datatables::of($scraped_data)->make(true);
    }
}
