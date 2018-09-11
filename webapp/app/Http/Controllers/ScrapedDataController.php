<?php

namespace App\Http\Controllers;

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
        $scraped_data = ScrapedData::get();
        return Datatables::of($scraped_data)->make(true);
    }
}
