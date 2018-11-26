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
                        <div class="box-body table-responsive">
                            <table class="table table-bordered" id="users-table">
                                <thead>
                                    <tr>
                                        <th>Id</th>
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
            $('#users-table').DataTable({
                "aLengthMenu": [10,25, 50, 100, 500, 1000],
                "iDisplayLength": 25,
                "sPaginationType" : "full_numbers",
                processing: true,
                serverSide: true,
                select: {
                    style: 'multi'
                },
                ajax: "{!! route('scraped_data.getdata') !!}",
                columns: [
                    { data: 'id', name: 'id' },
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
                   { orderable: false, targets: [1,2] }
                ]                
            });

            $('#users-table').on('click', '.view_details', function() {
                var id = $(this).attr('ref_id');
                var ajax_url = "{{url('/get_product_details')}}/";
                $.get(ajax_url + id, function(data, status){
                    var images_ar = [];
                    var product_details = JSON.parse(data.data);
                    console.log(product_details);
                    var html = '<div class="row"><div class="col-md-12">';
                    for (var key in product_details) {
                            if (product_details.hasOwnProperty(key)) {
                                    if(typeof(product_details[key]) == 'object'){
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

                    if(images_ar.length > 0){
                        html += '<div class="col-md-12 text-center" style="border-top:1px solid black; border-bottom:1px solid black; margin-top:30px; margin-bottom:20px;"><strong>IMAGES</strong></div><div class="row">';
                        for (i = 0; i < images_ar.length; i++) { 
                            html += '<div class="col-md-12"><div class="col-md-4"><div class="thumbnail"><a href="' + images_ar[i] + '"><img src="' + images_ar[i] + '" alt="Lights" style="width:100%"></a></div></div></div>';
                        }
                        html += '</div>';
                    }

                    $('.modal-body').html(html);
                    $("#myModal").modal()
                });
            });
        });
    </script>
@endsection