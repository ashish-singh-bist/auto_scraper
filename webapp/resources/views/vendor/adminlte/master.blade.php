<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>@yield('title_prefix', config('adminlte.title_prefix', ''))
@yield('title', config('adminlte.title', 'AdminLTE 2'))
@yield('title_postfix', config('adminlte.title_postfix', ''))</title>
    <!-- Tell the browser to be responsive to screen width -->
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
    <!-- Bootstrap 3.3.7 -->
    <link rel="stylesheet" href="{{ asset('vendor/adminlte/vendor/bootstrap/dist/css/bootstrap.min.css') }}">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="{{ asset('vendor/adminlte/vendor/font-awesome/css/font-awesome.min.css') }}">
    <!-- Ionicons -->
    <link rel="stylesheet" href="{{ asset('vendor/adminlte/vendor/Ionicons/css/ionicons.min.css') }}">

    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- @if(config('adminlte.plugins.select2'))
        <!-- Select2 -->
        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/css/select2.css">
    @endif --}}

    <!-- Theme style -->
    <link rel="stylesheet" href="{{ asset('vendor/adminlte/dist/css/AdminLTE.min.css') }}">

    {{-- @if(config('adminlte.plugins.datatables'))
        <!-- DataTables with bootstrap 3 style -->
        <link rel="stylesheet" href="//cdn.datatables.net/v/bs/dt-1.10.18/datatables.min.css">
    @endif --}}

    @yield('adminlte_css')

    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->

    <!-- Google Font -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">
    <!-- <link href="css/jquery-ui.css" rel="stylesheet"> -->
    {{-- <link href="css/from-the-page.css" rel="stylesheet"> --}}
    <link href="css/jquery-confirm.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
    <!-- Styles -->

    {{-- <script src="config/config.js"></script> --}}
  
    <script src="js/jquery-3.3.1.min.js"></script>
    <script src="js/bootstrap.min.js"></script>
    <script src="js/jquery-confirm.min.js"></script>

    {{-- <script src="js/index.js"></script> --}}
</head>
<body class="hold-transition @yield('body_class')">
    <div class="progress-bar" id="progress_bar">
        <div class="progress-bar-popup">
            <svg class="lds-spin" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"><g transform="translate(80,50)"><g transform="rotate(0)"><circle cx="0" cy="0" r="10" fill="#000" fill-opacity="1"><animateTransform attributeName="transform" type="scale" begin="-0.875s" values="1.1 1.1;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform><animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.875s"></animate></circle></g></g><g transform="translate(71.21320343559643,71.21320343559643)"><g transform="rotate(45)"><circle cx="0" cy="0" r="10" fill="#000" fill-opacity="0.875">  <animateTransform attributeName="transform" type="scale" begin="-0.75s" values="1.1 1.1;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>  <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.75s"></animate></circle></g></g><g transform="translate(50,80)"><g transform="rotate(90)"><circle cx="0" cy="0" r="10" fill="#000" fill-opacity="0.75">  <animateTransform attributeName="transform" type="scale" begin="-0.625s" values="1.1 1.1;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>  <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.625s"></animate></circle></g></g><g transform="translate(28.786796564403577,71.21320343559643)"><g transform="rotate(135)"><circle cx="0" cy="0" r="10" fill="#000" fill-opacity="0.625">  <animateTransform attributeName="transform" type="scale" begin="-0.5s" values="1.1 1.1;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>  <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.5s"></animate></circle></g></g><g transform="translate(20,50.00000000000001)"><g transform="rotate(180)"><circle cx="0" cy="0" r="10" fill="#000" fill-opacity="0.5">  <animateTransform attributeName="transform" type="scale" begin="-0.375s" values="1.1 1.1;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>  <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.375s"></animate></circle></g></g><g transform="translate(28.78679656440357,28.786796564403577)"><g transform="rotate(225)"><circle cx="0" cy="0" r="10" fill="#000" fill-opacity="0.375">  <animateTransform attributeName="transform" type="scale" begin="-0.25s" values="1.1 1.1;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>  <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.25s"></animate></circle></g></g><g transform="translate(49.99999999999999,20)"><g transform="rotate(270)"><circle cx="0" cy="0" r="10" fill="#000" fill-opacity="0.25">  <animateTransform attributeName="transform" type="scale" begin="-0.125s" values="1.1 1.1;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>  <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="-0.125s"></animate></circle></g></g><g transform="translate(71.21320343559643,28.78679656440357)"><g transform="rotate(315)"><circle cx="0" cy="0" r="10" fill="#000" fill-opacity="0.125">  <animateTransform attributeName="transform" type="scale" begin="0s" values="1.1 1.1;1 1" keyTimes="0;1" dur="1s" repeatCount="indefinite"></animateTransform>  <animate attributeName="fill-opacity" keyTimes="0;1" dur="1s" repeatCount="indefinite" values="1;0" begin="0s"></animate></circle></g></g></svg>
        </div>
    </div>
@yield('body')

<script src="{{ asset('vendor/adminlte/vendor/jquery/dist/jquery.min.js') }}"></script>
<script src="{{ asset('vendor/adminlte/vendor/jquery/dist/jquery.slimscroll.min.js') }}"></script>
<script src="{{ asset('vendor/adminlte/vendor/bootstrap/dist/js/bootstrap.min.js') }}"></script>
<script src="{{ asset('vendor/adminlte/dist/js/adminlte.min.js') }}"></script>



@if(config('adminlte.plugins.select2'))
    <!-- Select2 -->
    <script src="//cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/js/select2.min.js"></script>
@endif

@if(config('adminlte.plugins.datatables'))
    <!-- DataTables with bootstrap 3 renderer -->
    <script src="//cdn.datatables.net/v/bs/dt-1.10.18/datatables.min.js"></script>
@endif

@if(config('adminlte.plugins.chartjs'))
    <!-- ChartJS -->
    <script src="//cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.0/Chart.bundle.min.js"></script>
@endif

@if (Auth::check())
<script type="text/javascript">
    var config = {
        "root_ip": "{{ env('NODE_SERVER_IP')}}",
        "root_port": "{{ env('NODE_SERVER_PORT')}}",
        "chat_port": "{{ env('NODE_SERVER_CHAT_PORT')}}",
    };

    var user_id = '{{ Auth::user()->id }}';
    var user_name = '{{ Auth::user()->name }}';
    var chat_post_url = '{!! URL::to("sendmessage") !!}';
</script>
@endif

@yield('adminlte_js')

<!-- ChatJs  -->


<script src="js/chat.js"></script>
<!-- ChatJs  -->

</body>
</html>