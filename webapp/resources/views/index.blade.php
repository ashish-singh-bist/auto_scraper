@extends('adminlte::page')

@section('content_header')
    
@endsection
@section('content')
<div class="">
    <div class="row">
        <div class="col-md-12">
            <div class="alert alert-dismissible" id="msgBox" style="display: none;">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
                <span id="msgBoxMessage"></span>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <div id="fileUploadContainer">
                <form id="search_site_form" class="text-center">
                    <div class="box box-primary">
                        <div class="box-header with-border">
                            <h3 class="box-title">File Upload</h3>
                        </div>
                        <div class="box-body">
                            <div class="form-group">
                                <label for=file_upload class="fileUploadLabel">
                                    <img width="142" height="142" src="img/ic_open_in_browser_black_48dp_2x.png" />
                                    <div>Click to file upload</div>
                                </label>
                                <input id=file_upload type="file" name="file-upload" class="fileUpload" accept=".txt" class="" />
                                <p class="help-block" id="label_file_upload"></p>
                            </div>
                            <div class="checkbox">
                                <label>
                                    <input id="file_analyze" type="checkbox" class="custom-file-upload" name="file-analyze" /> Analyze page traffic?
                                </label>
                            </div>
                            <div><hr class="orDivderHr"><span class="orDivder">OR</span></div>
                            <textarea class="textInputUrls form-control" name="input-urls" placeholder="Input URL's here....." id="text_input_urls" rows="10" ></textarea>
                        </div>
                        <div class="box-footer">
                            <button id="submit_btn" disabled="" class="btn btn-primary">Process Urls</button>
                        </div>
                    </div>            
                </form>
            </div>
            <div id="fileResponseContainer">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Parsed Data</h3>
                    </div>
                    <div class="box-body no-padding">
                        <div id="fileResponseContainerData" class="table-responsive"></div>
                    </div>
                    <div class="box-footer">
                        <a href="/" class="btn btn btn-primary">Back</a>
                    </div>
                </div>

            </div>
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