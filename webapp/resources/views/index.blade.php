@extends('adminlte::page')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <!-- homepage input form -->
            <div id="website-input-form" class="container">

                <img width="142" height="142" src="img/ic_open_in_browser_black_48dp_2x.png" />

                <form class="form-inline" method="post" id="search_site_form">
                    <label for="file-upload" class="custom-file-upload" id="label-file-upload">
                        Click to Upload File
                    </label>
                    <input id="file-upload" type="file" name="file-upload" />

                    <textarea name="input-urls" placeholder="input URL's here....." id="text-input-urls" ></textarea>
                    
                    <button style="display:none;" id="submit-btn" type="submit">Go</button><br>
                    <input id="file-analyze" type="checkbox" class="custom-file-upload" name="file-analyze" /> Analyze page traffic?
                </form>

            </div>
        </div>
    </div>
</div>
@endsection
