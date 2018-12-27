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
                                            <option value="VidaXL">VidaXL</option>
                                            <option value="Youtube">Youtube</option>
                                            <option value="Ebay">Ebay</option>
                                            <option value="Piscineo">Piscineo</option>
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
                                        <th>Status</th>
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
    <script src="js/url_list_data.js"></script>
    <script type="text/javascript">

        $(function() {
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                }
            });

            var oTable = $('#url_list_table').DataTable({
                "aLengthMenu": [10,25, 50, 100, 500, 1000],
                "iDisplayLength": 25,
                "sPaginationType" : "full_numbers",
                processing: true,
                serverSide: true,
                select: {
                    style: 'multi'
                },
                ajax: {
                    url:  "{!! route('url_list.getdata') !!}",
                    data: function (d) {
                        d.source = $( "#url_source option:selected" ).val();
                    }
                },
                columns: [
                    { data: 'ref_id', name: 'ref_id' },
                    { data: 'url', name: 'url' },
                    { data: 'is_active', name: 'is_active' }
                ]
            });

            $('#url_list_table').on( 'click', '.active-incative-btn', function () {
                var rec_id = $(this).attr('rel');
                var uid = $(this).attr('uid');
                var is_active = $(this).attr('status');
                $.ajax({
                    type: "POST",
                    url: "{!! route('url_list.update') !!}",
                    dataType: "json",
                    data: {'is_active': is_active, 'id':rec_id, 'uid':uid},
                    success:function(data){
                        oTable.draw();
                        showMsg('success', "Successfully Changed");
                    },
                    error: function(error) {
                        console.log(error);
                        showMsg('error', 'Somthing going wrong refresh the window');
                    }
                });
            });

            $('#url_source').change(function(evt){
                oTable.draw();
            });

            $('#url_source').change(function(evt){
                var option_selected = $( "#url_source option:selected" ).val();
                if ( option_selected )
                    $('#scraping_for_url_list').prop('disabled', false);
                else
                    $('#scraping_for_url_list').prop('disabled', true);
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