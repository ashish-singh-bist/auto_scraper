@extends('adminlte::page')

@section('content_header')
    
@endsection
@section('content')
<div class="">
    <div class="row">
        <div class="col-md-12">
            {{-- <div id="fileUploadContainer" style="display: none;"> --}}
            <div id="fileUploadContainer" >
                <form id="search_site_form" class="text-center">
                    <div class="box box-primary">
                        <div class="box-header with-border">
                            <h3 class="box-title">File Upload</h3>
                        </div>
                        <div class="box-body">
                            <div class="form-group">
                                <label for=file_upload class="fileUploadLabel" title="Click to file upload">
                                    <img width="142" height="142" src="img/ic_open_in_browser_black_48dp_2x.png" />
                                    <div>Click to file upload</div>
                                </label>
                                <input id=file_upload type="file" name="file-upload" class="fileUpload" accept=".txt" class="" />
                                <p class="help-block" id="label_file_upload"></p>
                            </div>
                            <div class="checkbox">
                                <label title="Click Activate Debugger">
                                    <input id="is_debug" type="checkbox" class="custom-file-upload" name="isDebugger"/> Debugger ?
                                </label>
                            </div>
                            <div><hr class="orDivderHr"><span class="orDivder">OR</span></div>
                            <textarea class="textInputUrls form-control" name="input-urls" placeholder="Input URL's here....." id="text_input_urls" rows="10" ></textarea>
                        </div>
                        <div class="box-footer">
                            <button id="submit_btn" disabled="" class="btn btn-primary parse-btn" title="Click process urls">Process Urls</button>
                            <button style="display: none;" id="analysis_btn" disabled="" class="btn btn-primary parse-btn" title="Click process urls">Analysis Url</button>
                        </div>
                    </div>            
                </form>
            </div>
            
            <div id="debuggerContainer">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Debugger</h3>
                    </div>
                    <div class="box-body">
                        <div id="debugger_console" class="debugger-console"></div>
                    </div>
                </div>
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

        var USER_ID = {{ Auth::user()->id }};

        var config = {
            "root_ip": "{{ config('app.node_server_ip') }}",
            "root_port": "{{ config('app.node_server_port') }}",
        };
    </script>
    <script src="js/custom.js"></script>
    <script src="js/index.js"></script>
@endsection