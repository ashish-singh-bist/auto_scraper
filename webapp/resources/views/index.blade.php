@extends('adminlte::page')

@section('content_header')
    <h1>File Upload</h1>
@endsection
@section('content')
<div class="">
    <div class="row">
        <div class="col-md-12">
            <form method="post" id="search_site_form" class="text-center">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">File Upload</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label for="file-upload" class="fileUploadLabel">
                                <img width="142" height="142" src="img/ic_open_in_browser_black_48dp_2x.png" />
                                <div>Click to file upload</div>
                            </label>
                            <input id="file-upload" type="file" name="file-upload" accept=".txt" class="fileUpload" />
                            <p class="help-block" id="label-file-upload"></p>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input id="file-analyze" type="checkbox" class="custom-file-upload" name="file-analyze" /> Analyze page traffic?
                            </label>
                        </div>
                        <div><hr class="orDivderHr"><span class="orDivder">OR</span></div>
                        <textarea class="textInputUrls" name="input-urls" placeholder="Input URL's here....." id="text-input-urls" rows="10" ></textarea>
                    </div>
                    <div class="box-footer">
                        <button id="submit-btn" type="submit" class="btn btn-primary">Process Urls</button>
                    </div>
                </div>            
            </form>
        </div>
    </div>
</div>
@endsection
@section('adminlte_js')
    <script type="text/javascript">
        var config = {
            "root_ip": "{{ env('NODE_SERVER_IP')}}",
            "root_port": "{{ env('NODE_SERVER_PORT')}}",
        };
    </script>
    <script src="js/index.js"></script>
@endsection