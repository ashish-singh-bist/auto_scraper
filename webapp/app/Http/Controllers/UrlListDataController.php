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

    public function getData(Request $request)
    {
        $columns = ['ref_id','url', 'is_active'];
        $id = Auth::user()->id;

        // add limit and sort order to retrieve data
        $limit = $request->input('length');
        $start = $request->input('start');
        $order = $columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');

        if ( isset($request->source) and $request->source ) {
            $url_list_data =  UrlListData::where('user_id', $id)->where('source', $request->source);
        }
        else{
            $url_list_data =  UrlListData::where('user_id', $id);
        }
        
        $totalData = $url_list_data->count();

        // query to retrieve log booking data as per limit and sort order
        $ul_data = $url_list_data->offset(intval($start))
                     ->limit(intval($limit))
                     ->orderBy($order,$dir)
                     ->get();

        $totalFiltered = $totalData;
        for($i=0; $i < count($ul_data); $i++)
        {   
            if( $ul_data[$i]['is_active'] )
                $ul_data[$i]['is_active'] = '<button type="button" uid="'.$ul_data[$i]['user_id'].'" rel="'.$ul_data[$i]['id'].'" title="Click to Inactive" class="btn btn-xs btn-success active-incative-btn" status="1" >Active</button>';
            else
                $ul_data[$i]['is_active'] = '<button type="button" uid="'.$ul_data[$i]['user_id'].'" rel="'.$ul_data[$i]['id'].'" title="Click to Active" class="btn btn-xs btn-danger active-incative-btn" status="0" >Inactive</button>';
        }

        $json_data = array(
                    "draw"            => intval($request->input('draw')),
                    "recordsTotal"    => intval($totalData),
                    "recordsFiltered" => intval($totalFiltered),
                    "data"            => $ul_data,
                    );
            
        echo json_encode($json_data);
    }

    public function update(Request $request)
    {   
        $id = $request->id;
        $uid = $request->uid;
        $currentLoginUserId = Auth::user()->id;
        $res = false;
        if( $currentLoginUserId == $uid ){
            $input = $request->all();
            $input['is_active'] = ($input['is_active'] == 1) ? 0 : 1 ;
            $url_list_data =  UrlListData::find($id);
            if($url_list_data){
                $url_list_data->fill($input);
                $res = $url_list_data->save();
            }
            return  response()->json([
                'status' => $res
            ]);
        }
    }

    // public function getSourceData(Request $request)
    // {
    //     $columns = ['ref_id','url', 'is_active'];
    //     $id = Auth::user()->id;

    //     // add limit and sort order to retrieve data
    //     // $limit = $request->input('length');
    //     // $start = $request->input('start');
    //     // $order = $columns[$request->input('order.0.column')];
    //     // $dir = $request->input('order.0.dir');

    //     $source = $request->source;

    //     $url_list_data =  UrlListData::where('user_id', $id)->where('source', $source);
    //     $totalData = $url_list_data->count();

    //     // query to retrieve log booking data as per limit and sort order
    //     $ul_data = $url_list_data
    //     // ->offset(intval($start))
    //     //              ->limit(intval($limit))
    //     //              ->orderBy($order,$dir)
    //                  ->get();

    //     $totalFiltered = $totalData;
    //     for($i=0; $i < count($ul_data); $i++)
    //     {   
    //         if( $ul_data[$i]['is_active'] )
    //             $ul_data[$i]['is_active'] = '<button type="button" uid="'.$ul_data[$i]['user_id'].'" rel="'.$ul_data[$i]['id'].'" title="Click to Inactive" class="btn btn-xs btn-success active-incative-btn" status="1" >Active</button>';
    //         else
    //             $ul_data[$i]['is_active'] = '<button type="button" uid="'.$ul_data[$i]['user_id'].'" rel="'.$ul_data[$i]['id'].'" title="Click to Active" class="btn btn-xs btn-danger active-incative-btn" status="0" >Inactive</button>';
    //     }

    //     $json_data = array(
    //                 "draw"            => intval($request->input('draw')),
    //                 "recordsTotal"    => intval($totalData),
    //                 "recordsFiltered" => intval($totalFiltered),
    //                 "data"            => $ul_data,
    //                 );
            
    //     echo json_encode($json_data);
    // }
}
