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
                    { data: 'user_id', name: 'user_id' },
                    { data: 'data', name: 'data' }
                ]
            });
        });
    </script>
@endsection