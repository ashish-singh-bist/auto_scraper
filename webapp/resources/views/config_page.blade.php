@extends('layouts.config')

@section('config_page_script')
    <script src="js/config_page_script.js"></script>
@stop
@section('content')
    <style type="text/css">
        .config-page{
            border: 0;
            width: 100%;
            height: 80vh;
            background-image: url('https://i.gifer.com/Qgyn.gif');
            background-repeat: no-repeat;
            background-position: center;
        }
        .mb-0{
            margin-bottom: 0;
        }
        .hover-selected{
            color: red !important;
        }
    </style>
    <div class="box box-primary mb-0">
        <div class="box-body">
            <p>{{$iframe_url}}</p>
            <iframe class="config-page" src="/config_page_frame?url={{urlencode($iframe_url)}}" onload="myFunction();"></iframe>
        </div>
    </div>
@stop


