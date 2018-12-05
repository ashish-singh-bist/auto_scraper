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
                                            @foreach ($sources as $source)
                                                <option value="{{$source}}">{{$source}}</option>
                                            @endforeach
                                        </select>
                                    </div>
                                </div>
                                <div class="col=md-3 col-sm-3 col-xs-12">
                                    <div class="form-group">
                                        <label>&nbsp;</label>
                                        <button type="button" class="btn btn-block btn-primary btn-sm form-control" id="scraping_for_url_list" style="background-color: #3c8dbc" disabled="">Export CSV</button>
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
                            <table class="table table-bordered" id="users-table">
                                <thead>
                                    <tr>
                                        <th>Id</th>
                                        <th>Source</th>
                                        <th>Url</th>
                                        <th>Data</th>
                                        <th>View Data</th>
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


    <!-- product popup model -->
    <div class="container">
        <!-- Modal -->
        <div class="modal fade" id="myModal" role="dialog">
            <div class="modal-dialog modal-lg">
            
                <!-- Modal content-->
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title"><strong>Product Details</strong></h4>
                    </div>
                    <div class="modal-body">
                        
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </div>
                
            </div>
        </div>
        <!-- product popup model end -->
    </div>

@endsection
@section('adminlte_js')
    <script type="text/javascript">
        $(function() {
            $("#url_source").val("");
            var oTable = $('#users-table').DataTable({
                "aLengthMenu": [10,25, 50, 100, 500, 1000],
                "iDisplayLength": 25,
                "sPaginationType" : "full_numbers",
                processing: true,
                serverSide: true,
                select: {
                    style: 'multi'
                },
                ajax: {
                    url:  "{!! route('scraped_data.getdata') !!}",
                    data: function (d) {
                        d.source = $( "#url_source option:selected" ).val();
                    }
                },
                columns: [
                    { data: 'id', name: 'id' },
                    { data: 'source', name: 'source' },
                    { data: 'actual_url', name: 'actual_url' },
                    { data: 'data', name: 'data' },
                    { 
                        "data": "id",
                        render: function(data, type, row, meta){
                            data = '<button class="btn btn-primary view_details" href="javascript:void(0)" ref_id="' + data + '"><i class="fa fa-eye"></i></button>';
                            return data;
                        }
                    },                    
                ],
                columnDefs: [
                   { orderable: false, targets: [2,3,4] }
                ]                
            });

            $('#url_source').change(function(evt){
                oTable.draw();
            });

            $('#users-table').on('click', '.view_details', function() {
                var id = $(this).attr('ref_id');
                var ajax_url = "{{url('/get_product_details')}}/";
                $.get(ajax_url + id, function(data, status){
                    var image_key_array = [];
                    var product_details = JSON.parse(data.data);
                    var html = '<div class="row"><div class="col-md-12">';
                    for (var key in product_details) {
                            if (product_details.hasOwnProperty(key)) {
                                if (typeof(product_details[key]) == 'string' && product_details[key].indexOf('.jpg') >= 0) {
                                    image_key_array.push(key);
                                }
                                else if (typeof(product_details[key]) == 'object' && JSON.stringify(product_details[key]).indexOf('.jpg') >= 0) {
                                    image_key_array.push(key);
                                }
                                else if(typeof(product_details[key]) == 'object'){
                                    var temp_obj = product_details[key];
                                    html += '<div class="col-md-12" style="border-bottom:1px solid lightgray; padding:5px 0;"><div class="row"><div class="col-md-12"><div class="col-md-4"><strong>' + key.toUpperCase() + '</strong></div><div class="col-md-8" style="background:#ddd; padding:5px;">';
                                    for (var key1 in temp_obj) {
                                        if (temp_obj.hasOwnProperty(key1)) {
                                            html += '<div class="row"><div class="col-md-12"><div class="col-md-4"><strong>' + key1.toUpperCase() + '</strong></div><div class="col-md-8">' + temp_obj[key1] + '</div></div></div>';
                                        }
                                    }
                                    html += '</div></div></div></div>';
                                }
                                else{
                                    html += '<div class="col-md-12" style="border-bottom:1px solid lightgray; padding:5px 0;"><div class="row"><div class="col-md-12"><div class="col-md-4"><strong>' + key.toUpperCase() + '</strong></div><div class="col-md-8">' + product_details[key] + '</div></div></div></div>';
                                }
                            }
                    }
                    html += '</div></div>';

                    var single_imgae_html = '<div class="col-md-12 text-center" style="border-top:1px solid black; border-bottom:1px solid black; margin-top:30px; margin-bottom:20px;"><strong>IMAGES</strong></div>';
                    var multi_imgae_html = '';
                    var img_count = 0;
                    for(var i = 0; i < image_key_array.length; i++){
                        if(typeof(product_details[image_key_array[i]]) == 'object'){
                            if(product_details[image_key_array[i]].length > 0){
                                multi_imgae_html += '<div class="row">';
                                for (j = 0; j < product_details[image_key_array[i]].length; j++) {
                                    var img_url = product_details[image_key_array[i]][j];
                                    multi_imgae_html += '<div class="col-md-4"><div class="thumbnail"><a href="' + img_url + '"><img src="' + img_url + '" alt="Lights" style="width:100%"></a></div></div>';
                                }
                                multi_imgae_html += '</div>';
                            }
                        }else{
                            var img_url = product_details[image_key_array[i]];
                            single_imgae_html += '<div class="row"><div class="col-md-6 col-sm-offset-3"><div class="thumbnail"><a href="' + img_url + '"><img src="' + img_url + '" alt="Lights" style="width:100%"></a></div></div></div>';
                        }
                        img_count++;
                    }
                    if(img_count > 0){
                        html += single_imgae_html;
                        html += multi_imgae_html;
                    }

                    $('.modal-body').html(html);
                    $("#myModal").modal()
                });
            });
        });
    </script>
    <script>
        $( document ).ready(function(){
            $("#url_source").val("");
            $('#scraping_for_url_list').prop('disabled', true);

            $('#url_source').change(function(evt){
                var option_selected = $( "#url_source option:selected" ).val();
                if ( option_selected )
                    $('#scraping_for_url_list').prop('disabled', false);
                else
                    $('#scraping_for_url_list').prop('disabled', true);
            });

            $('#scraping_for_url_list').click(function(evt){
                var option_selected = $( "#url_source option:selected" ).val();
                if ( option_selected ) {
                    let data = {
                        source: option_selected,
                    }
                    $.ajax({
                        type: 'GET',
                        url: "{{ route('scraped_data.getcsvfile') }}",
                        data: data,
                        success: function(res, status, xhr) {
                            var csvData = new Blob([res], {type: 'text/csv;charset=utf-8;'});
                            if (navigator.appVersion.toString().indexOf('.NET') > 0){
                                window.navigator.msSaveBlob(csvData, 'data.csv');
                            }
                            else{
                                var csvURL = window.URL.createObjectURL(csvData);
                                var tempLink = document.createElement('a');
                                tempLink.href = csvURL;
                                tempLink.setAttribute('download', 'data.csv');
                                document.body.appendChild(tempLink);
                                tempLink.click();
                                document.body.removeChild(tempLink);
                            }
                        },
                        error:function( e){
                            console.log(e);
                        }
                    });
                }
            });

        });
    </script>
@endsection