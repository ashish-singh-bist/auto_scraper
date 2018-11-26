<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Yajra\Datatables\Datatables;
use App\ScrapedData;
use Response;

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
        $sources = [];
        $id = Auth::user()->id;
        $scraped_sources = ScrapedData::where('user_id', $id)->whereNotNull('source')->distinct()->get(['source']);
        foreach($scraped_sources as $row) {
            array_push( $sources, $row->source);
        }
        return view('scraped_data', ['sources' => $sources]);
    }

    public function getData(Request $request)
    {
        // $id = Auth::user()->id;
        // $scraped_data = ScrapedData::where('user_id', $id)->get();
        // return Datatables::of($scraped_data)->make(true);
        $columns = ['id','source', 'data'];
        $id = Auth::user()->id;

        // add limit and sort order to retrieve data
        $limit = $request->input('length');
        $start = $request->input('start');
        $order = $columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');

        if ( isset($request->source) and $request->source ) {
            $url_list_data =  ScrapedData::where('user_id', $id)->where('source', $request->source);
        }
        else{
            $url_list_data =  ScrapedData::where('user_id', $id);
        }
        
        $totalData = $url_list_data->count();

        // query to retrieve log booking data as per limit and sort order
        $ul_data = $url_list_data->offset(intval($start))
                     ->limit(intval($limit))
                     ->orderBy($order,$dir)
                     ->get();

        $totalFiltered = $totalData;
        // for($i=0; $i < count($ul_data); $i++)
        // {   
        //     if( $ul_data[$i]['is_active'] )
        //         $ul_data[$i]['is_active'] = '<button type="button" uid="'.$ul_data[$i]['user_id'].'" rel="'.$ul_data[$i]['id'].'" title="Click to Inactive" class="btn btn-xs btn-success active-incative-btn" status="1" >Active</button>';
        //     else
        //         $ul_data[$i]['is_active'] = '<button type="button" uid="'.$ul_data[$i]['user_id'].'" rel="'.$ul_data[$i]['id'].'" title="Click to Active" class="btn btn-xs btn-danger active-incative-btn" status="0" >Inactive</button>';
        // }

        $json_data = array(
                    "draw"            => intval($request->input('draw')),
                    "recordsTotal"    => intval($totalData),
                    "recordsFiltered" => intval($totalFiltered),
                    "data"            => $ul_data,
                    );
            
        echo json_encode($json_data);
    }

    public function getProductDetails($id, request $request)
    {
        $user_id = Auth::user()->id;
        $product_details = ScrapedData::where('user_id', $user_id)->where('id', $id)->first();
        return Response::json($product_details);
    }    
    public function getCsvFile( Request $request)
    {   
        $user_id = Auth::user()->id;
        $columns = [];
        $headers = array(
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=file.csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        );
        if ( isset($request->source) && $request->source) {
            $scraped_records = ScrapedData::where('user_id', $user_id)->where('source', $request->source)->get();
            if ($scraped_records) {
                $column_json = json_decode($scraped_records->first()->data);
                foreach($column_json as $key => $val) {
                    array_push( $columns, $key);
                }
            }
            $callback = function() use ($scraped_records, $columns)
            {
                $file = fopen('php://output', 'w');
                fputcsv($file, $columns);

                foreach($scraped_records as $row) {
                    $data_row = [];
                    foreach ($columns as $key) {
                        $json_data = json_decode( $row->data );

                        if(array_key_exists($key,$json_data)){
                            if(gettype($json_data->$key) == 'array'){
                                array_push($data_row, join(", ", $json_data->$key));
                            }else{
                                array_push($data_row, $json_data->$key);
                            }
                        }else{
                            array_push($data_row, '');
                        }
                    }
                    fputcsv($file, $data_row);
                }
                fclose($file);
            };
            // echo json_encode(array("abc" => "string data"));
            return Response::stream($callback, 200, $headers);
        }
    }
    public function getSourceNames( Request $request){
        $sources = [];
        $scraped_sources = ScrapedData::distinct('source')->get();
        foreach($scraped_sources as $row) {
            array_push( $sources, $row->source);
        }
        
        dd($sources);
    }
}
