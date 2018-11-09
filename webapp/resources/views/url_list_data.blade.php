@extends('adminlte::page')

@section('content_header')
    
@endsection
@section('content') 
    <!-- content wrapper. contains page content -->
    <div class="content-panel">
        <!-- main content-->
        <section class="content">
            <div class="row">
                <div class="col-xs-12">
                    <div class="box box-primary">
                        <div class="box-body">
                            <div class="row">
                                <div class="col-md-6 col-sm-6 col-xs-12">
                                    <div class="form-group">
                                        <label>Soucre</label>
                                        <select class="form-control" id="url_source">
                                            <option value="" selected="">Choose Source</option>
                                            <option value="vidaxl">VidaXL</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col=md-3 col-sm-3 col-xs-12">
                                    <div class="form-group">
                                        <label>&nbsp;</label>
                                        <button type="button" class="btn btn-block btn-primary btn-sm form-control" id="scraping_for_url_list" style="background-color: #3c8dbc" disabled="">Parse Using Soucre</button>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-xs-12">
                    <div class="box box-primary">
                        <div class="box-body table-responsive">
                            <table class="table table-bordered" id="url_list_table">
                                <thead>
                                    <tr>
                                        <th>Ref. Id</th>
                                        <th>URL</th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <!-- end of main content-->
    </div>
    <!-- end of content wrapper. contains page content -->
@endsection
@section('adminlte_js')
    <script type="text/javascript">
        $(function() {
            $('#url_list_table').DataTable({
                "aLengthMenu": [10,25, 50, 100, 500, 1000],
                "iDisplayLength": 25,
                "sPaginationType" : "full_numbers",
                processing: true,
                serverSide: true,
                select: {
                    style: 'multi'
                },
                ajax: "{!! route('url_list.getdata') !!}",
                columns: [
                    { data: 'ref_id', name: 'ref_id' },
                    { data: 'url', name: 'url' }
                ]
            });
        });
    </script>

    <script type="text/javascript">

        var USER_ID = {{ Auth::user()->id }};

        var config = {
            "root_ip": "{{ config('app.node_server_ip') }}",
            "root_port": "{{ config('app.node_server_port') }}",
        };
    </script>
    <script src="js/custom.js"></script>
@endsection