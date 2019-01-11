// var config_ = #{config};
document.body.className += ' ' + 'page-loading';
_url = 'http://' + root_ip + ':' + root_port;
if (url_post_part_)
    _url += url_post_part_ +'&host=' + host_ + '&uid=' + uid_;
else
    _url += '?host=' + host_ + '&uid=' + uid_;
 
console.log(_url);
document.getElementById('config_page').src = _url ;

function myFunction(){
    console.log( config_obj );
    var config_page_obj = document.getElementById('config_page');
    var config_page_obj_document = config_page_obj.contentWindow.document;

    var data_object = [], printable_data = {};
    if ( config_obj ) {
        var coj = $('<textarea />').html(config_obj).text();
        config_obj = JSON.parse( coj );
        data_object = config_obj.data;
        console.log( data_object );
        mapConfig();
    }
    // console.log( doj);
    // console.log( 'data_object', data_object);
    // console.log( 'data_object type ', typeof(data_object));
    // console.log( JSON.parse( data_object ));

    base_ip = root_ip + ':' + root_port;
    $('body').removeClass('page-loading');

    function mapConfig(){
        console.log( 'mapConfig' );
        for(var obj of data_object){
            if ('code_to_inject' in obj){
                // var data_key = obj.key;
                // var html = document.documentElement.innerHTML;
                // printable_data[data_key] = eval('try {' + obj.code_to_inject + '}catch(err) {err.message}');
            }
            /* finding element via `id` */
            else if('id' in obj.attributes){
                var element = config_page_obj_document.getElementById(obj.attributes['id']);
                if(element){
                    mapConfigSelectElement( obj, obj.attributes['id'] );
                    continue;
                }
            }
            else{
                mapConfigSelectElement( obj );
            }
        }        
    }

    function mapConfigSelectElement( property_obj, _id = ''){
        console.log( 'mapConfigSelectElement', _id );
        if ( _id ) {
            var targetelement = config_page_obj_document.getElementById(_id);
            mapConfigSelectElementMapping( targetelement, property_obj );
        }
        else{
            if ( property_obj.xpath ) {
                var targetelement = config_page_obj_document.evaluate( property_obj.xpath, config_page_obj_document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                mapConfigSelectElementMapping( targetelement, property_obj );
            }
            
        }
    }    

    function mapConfigSelectElementMapping( targetelement, property_obj ){
        var value = targetelement.src? targetelement.src.replace(re, ''): targetelement.textContent? targetelement.textContent.replace(/[\n\t\r]/g, '').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2').trim() : targetelement.value.replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2');
        targetelement.classList.add('option-selected');
        targetelement.classList.add('opt_selected_'+property_obj.key);
        targetelement.setAttribute('labelkey', property_obj.key);
        $('#panel_table').show();
        $('#selected_props_list_tbody').append('<tr class="'+property_obj.key+'_tr"><td><span class="del_prop_btn" key="'+property_obj.key+'" title="Remove this item">×</span></td><td>'+property_obj.key+'</td><td>'+value+'</td></tr>');
    }
    /* to calculate xpath of a given element */
    function getXPathAutoScraper(element) {
        var paths = [];
        
        for (; element && element.nodeType == 1; element = element.parentNode) {
            var index = 0;
            for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                // Ignore document type declaration.
                if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                    continue;
                if (sibling.nodeName == element.nodeName)
                    ++index;
            }
            var tagName = element.nodeName.toLowerCase();
            var pathIndex = (index ? "["+(index + 1) + "]" : "");
            paths.splice(0, 0, tagName + pathIndex);
        }
        return paths.length ? "/" + paths.join("/"): null;
    }

    $('#config_page').contents().find('head').append( '<link href="http://'+base_ip+'/css/from-the-page.css" rel="stylesheet">' );
    $('#config_page').contents().find('body').bind("click", clickevent);
    $('#config_page').contents().find('body').bind("contextmenu", rightclickevent);

    // $('#config_page').contents().find('*').mouseenter(function(){
    $('#config_page').contents().find('*').mouseover(function(event){
        //Do whatever you need
        // console.log($(this).text());
        if(event.target.className.indexOf('option-selected') < 0){
            event.target.classList.add('hover-selected');
        }
        targetelement = event.target;
        if(event.target.closest(".avoid-ele") == null){
            $('#tag_info_block').show();
            var tag_info = '';
            if (targetelement.tagName.toLowerCase())
                tag_info += '<span class="_tag"><span style="color:#fff">Target - </span>'+ targetelement.tagName.toLowerCase()+'</span>';
            var targetelement_classList = Array.from(targetelement.classList);
            var index = targetelement_classList.indexOf('hover-selected');
            if (index > -1)
                 targetelement_classList.splice(index, 1);
            var index = targetelement_classList.indexOf('option-selected');
            if (index > -1)
                 targetelement_classList.splice(index, 1);

            if (targetelement_classList.length > 0)
                tag_info += ' | <span class="_class"><span style="color:#fff">Class - </span>'+ targetelement_classList + '</span>';
            if (targetelement.id)
                tag_info += ' | <span class="_id"><span style="color:#fff">Id - </span>'+ targetelement.id + '</span>';
            
            // tag_info += '<span class="tag_info_spliter">|</span>';
            // if (targetelement.parentElement.tagName.toLowerCase())
            //     tag_info += '<span class="_tag"><span style="color:#fff">Parent - </span>'+ targetelement.parentElement.tagName.toLowerCase()+'</span>';
            // if (targetelement.parentElement.classList.length > 0)
            //     tag_info += ' | <span class="_class"><span style="color:#fff">Class - </span>'+ targetelement.parentElement.classList + '</span>';
            // if (targetelement.parentElement.id)
            //     tag_info += ' | <span class="_id"><span style="color:#fff">Id - </span>'+ targetelement.parentElement.id + '</span>';
            
            $('#tag_info').html( tag_info );
        }
        else{
            $('#tag_info_block').hide();
            $('#tag_info').html('');
        }
    });

    // $('#config_page').contents().find('*').mouseleave(function(){
    $('#config_page').contents().find('*').mouseout(function(event){
        //Do whatever you need
        // console.log($(this).text());
        // console.log($(this));
        // $(this).removeClass('hover-selected');
        event.target.classList.remove('hover-selected');
        $('#tag_info_block').hide();
        $('#tag_info').html('');
        // $(this).attr('style','color:black;');
    });

    function clickevent(event){
        // alert(event.target);
        // event.preventDefault();
        targetelement = event.target;
        getXPath(event.target);
        checkForClass(event.target, event.pageX, event.pageY);
    }

    function rightclickevent(event){
        // alert(event.target);
        // event.preventDefault();
    }

    /* function for generating xpath */
    var x_paths;
    function getXPath(element){
        function getElementXPath(element) {
            return getElementTreeXPath(element);
        }
        function getElementTreeXPath(element) {
            var paths = [];
            for (; element && element.nodeType == 1; element = element.parentNode) {
                var index = 0;
                for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                    if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                        continue;
                    if (sibling.nodeName == element.nodeName)
                        ++index;
                }
                var tagName = element.nodeName.toLowerCase();
                var pathIndex = (index ? "["+(index + 1) + "]" : "");
                paths.splice(0, 0, tagName + pathIndex);
            }
            return paths.length ? "/" + paths.join("/"): null;
        }
        x_paths = getElementXPath(element);
        console.log(x_paths);
    }

    /*_________________________for scraping detailed page______________________________________________________*/

    /* check whether an element is already selected or not */
    function checkForClass(targetelement, x, y){
        var classexistsflag = checkElement(targetelement);
        // console.log('classexistsflag - '+classexistsflag);
        if(classexistsflag){
            /* if already selected, unselect it and don't display label input box */
            // alert('Already Selected, See Highlight record in table');
            var _key = targetelement.getAttribute('labelkey');
            showMessage( _key, 'already selected, see record in table', 'danger' );
            // document.getElementById("context").style.display = "none";
            // document.getElementById("property_builder").style.display = "none";
            // // document.getElementById('property_builder').style.display = 'none';
            // targetelement.classList.remove('option-selected');
            dataHighlighter(_key);
        }else{
            /* if not selected, select it and display the label input box, so that user can enter a label */
            // document.getElementById('property_builder').setAttribute('style', 'display:block; left:'+(x)+'px;top:'+(y)+'px;');
            document.getElementById('property_builder').setAttribute('style', 'display:block; left:'+0+'px;top:'+0+'px;');
            document.getElementById('label_item_value').setAttribute('class','textareabox');

            //for cases like one in `https://www.airbnb.co.in/rooms/20814508` where the <div> contains the image url in its `style` property
            let image   = (window.getComputedStyle(targetelement).backgroundImage);
            image       = image.substr(5, image.length-7);

            let replace = '(.)+' + root_port + '\/';
            let re      = new RegExp(replace, "g");

            if(image.length)
                document.getElementById('label_item_value').value = image;
            else if(targetelement.hasAttribute('src'))
                document.getElementById('label_item_value').value = targetelement.src.replace(re, ''); //targetelement.src.replace(/(.)+3002\//, '');
            else
                document.getElementById('label_item_value').value = targetelement.textContent.replace(/[\n\t\r]/g, '').replace(/\s\s+/g, ' ').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2');
        }

    }

    /* this function is called in checkForClass() [above] to check for class `option-selected` in the current element and its parents, in order to conclude whether it is already selected or not. [We add class `option-selected` on elements which are selected] 

    A parent is also checked here so as to avoid selecting a child element if its immediate parent is already selected, having the same value*/
    function checkElement(childelement){
        var parentelement = childelement.parentElement;
            
        if(childelement.className.indexOf('option-selected') >= 0){
            return true;
        }else if(parentelement.className && parentelement.className !== ''){
            if(parentelement.className.indexOf('option-selected') >= 0)
                return true
            else
                return false
        }else{
            return checkElement(parentelement);
        }
    }

    function showMessage(key, msg, type, duration=10000){
        var _id = key + '_xxx_' + new Date().getTime();
        var _html = '<div id="'+_id+'" class="alert alert-'+type+' fade in alert-dismissible"><a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>';
        if(key)
            _html += '<strong>' + key + '</strong>&nbsp;'+ msg;
        else
            _html += msg;
        _html += '</div>';
        $('.msg-panel').append(_html); 
        setTimeout(function(){
            $('#'+_id).fadeOut('slow');
        },duration);
    }

    function dataHighlighter(key, duration=6000){
        $('.'+key+'_tr').addClass('highlight-rec');
        setTimeout(function(){
            $('.'+key+'_tr').removeClass('highlight-rec');
        },duration);
    }
    function postElement(label, targetelement){
        let newdataobject        = {};
        let child = targetelement;
        let i = 0;
        console.log('targetelement - '+targetelement);
        console.log('label_item_value - '+document.getElementById('label_item_value').value);
        while( (child = child.previousSibling) != null ) // to get the index of the element in its parent's child list
            i++;
        label = label.trim().replace(/\s+/g, '_');

        if(document.getElementById('advance_code_input_text').value){
            newdataobject["key"]    = label;
            newdataobject["code_to_inject"] = document.getElementById('advance_code_input_text').value;
        }
        else{
            newdataobject["key"]    = label;
            // newdataobject["value"]   = targetelement.textContent.replace(/[\n\t\r]/g, '').replace(/\s\s+/g, ' ');
            newdataobject["tag"]    = targetelement.tagName.toLowerCase();
            newdataobject["xpath"]  = x_paths;
            newdataobject["attributes"] = getAttr();
            newdataobject["children"]   = targetelement.childElementCount;
            newdataobject["child_index"]= i;
            
            var temp_parent_xpath   =  x_paths.split('/');
                temp_parent_xpath.pop();
            newdataobject["parent_xpath"]       = temp_parent_xpath.join('/');
            newdataobject["parent_attributes"]  = getAttr(targetelement.parentElement);
            newdataobject["parent_tag"]         = targetelement.parentElement.tagName.toLowerCase();    
        }
        
        console.log("data_object type - ", data_object)
        console.log("data_object - ", typeof(data_object))
        data_object.push(newdataobject)
        console.log("data[insert]: ", data_object)

        /*Display selected item in panel*/
        if(document.getElementById('advance_code_input_text').value){
            var html = document.documentElement.innerHTML;
            var res = eval('try {' + document.getElementById('advance_code_input_text').value + '}catch(err) {err.message}');
            var display_selected_list = '<tr class="'+label+'_tr"><td><span class="del_prop_btn" key="'+label+'" title="Remove this item">×</span></td><td>'+label+'</td><td>'+ res +'</td></tr>';    
        }
        else if(document.getElementById('id_selector_text').value){
            console.log(document.querySelector(document.getElementById('id_selector_text').value).innerHTML);
            var display_selected_list = '<tr class="'+label+'_tr"><td><span class="del_prop_btn" key="'+label+'" title="Remove this item">×</span></td><td>'+label+'</td><td>'+document.querySelector(document.getElementById('id_selector_text').value).innerHTML+'</td></tr>';
        }
        else{
            var display_selected_list = '<tr class="'+label+'_tr"><td><span class="del_prop_btn" key="'+label+'" title="Remove this item">×</span></td><td>'+label+'</td><td>'+document.getElementById('label_item_value').value+'</td></tr>';
        }

        $('#panel_table').show();
        $('#selected_props_list_tbody').append(display_selected_list);
        showMessage( label, 'label successfuly added, see record in table', 'success' );
        dataHighlighter(label);
        
        /* to extract and create a list of the element's attributes */
        function getAttr(ele = targetelement){
            let temp = {};
            let arr  = [];
            let attrlist = ele.attributes;
            for(var i=0; i< attrlist.length; i++){
                if(attrlist[i].name != 'href' && attrlist[i].name.match('ng-') == null && attrlist[i].name != 'labelkey' && attrlist[i].name != 'style' && (attrlist[i].value !== '' && attrlist[i].value !== ' '))
                    temp[attrlist[i].name] = attrlist[i].value.replace('option-selected', '').replace(/\s+$/, '');
            }
            return temp;
        }
        document.getElementById('property_builder').style.display = 'none';
        document.getElementById('property_builder_text').value = '';
        document.getElementById('advance_code_input_text').value = '';
    }

    function selectElement(path, label){
        key_flag = false;
        for(var x=0; x< data_object.length; x++){
            if(data_object[x]["key"] === label){
                key_flag = true;
                document.getElementById('property_builder_text').value = '';
                document.getElementById('advance_code_input_text').value = '';
                document.getElementById('property_builder_text').style.borderColor = 'red';
                showMessage( label, ' is duplicate name, see record in table', 'danger' );
                dataHighlighter(label);
            }
        }
        if(!key_flag){
            var targetelement = config_page_obj_document.evaluate( path, config_page_obj_document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            targetelement.classList.add('option-selected');
            console.log('label - '+label);
            targetelement.classList.add('opt_selected_'+label);
            targetelement.setAttribute('labelkey', label);
            postElement(label, targetelement);
        }
    }

    function unselectElement(key){
        for(var i=0; i<data_object.length; i++){
            if(data_object[i].key === key)
                data_object.splice(i,1);
        }
        //console.log("data[delete]: ", data_object)
    }
    /* function for lable input `OK` button*/
    $(document).on('click', '#property_builder_ok_btn', function(event){
        event.preventDefault();
        event.stopPropagation();

        let label = document.getElementById('property_builder_text').value;
        label = label.trim().replace(/\s+/g, '_');

        if(label != '')
            selectElement(x_paths, label);
    });

    $(document).on('click', '#create_config', function(event){
        var puppeteerEnabled = false;
        if($('#puppeteer_enabled').is(':checked'))
            var puppeteerEnabled = true;

        var data = {
            data: data_object,
            url: host_,
            user_id: uid_,
            puppeteer_enabled: puppeteerEnabled
        }
                    
        fetch('/rtech/api/done_config', {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json' 
            },
            method: 'POST'
        })
        .then(response => response.json())
        .then(res => {
            // window.location = config.homepage_rtech;
            var ww = window.open('', '_self'); ww.close();
        })
    });

    $(document).on('click', '.close-btn_', function(){
        // document.getElementById('context').style.display = 'none';
        document.getElementById('property_builder').style.display = 'none';
    });

    $(document).on('click', '.del_prop_btn', function(){
        var _key = this.getAttribute('key');
        unselectElement(_key);
        obj_to_del = config_page_obj_document.getElementsByClassName( 'opt_selected_'+_key );
        console.log( obj_to_del );
        obj_to_del[0].classList.remove('option-selected');
        // $('.opt_selected_'+_key).removeClass("option-selected");
        var i = this.parentNode.parentNode.rowIndex;
        document.getElementById("panel_table").deleteRow(i);
        var rowCount = document.getElementById("panel_table").rows.length;
        if( rowCount == 1){
            $('#panel_table').hide();
        }
        showMessage( _key, 'is successfuly removed', 'info' );
    });

    $(document).on('click', '#del_all_prop_btn', function(){
        localStorage.removeItem('data');
        localStorage.removeItem('detailpageflag');
        data_object = [];
        var selected_items = config_page_obj_document.getElementsByClassName('option-selected');
        if(selected_items.length > 0)
            while(selected_items.length)
                selected_items[0] = selected_items[0].classList.remove('option-selected');
        resetConfigurationPanelData();
    });

    function resetConfigurationPanelData(){
        showMessage('', '<strong>All records are delete.</strong>', 'success');
        var rowCount = document.getElementById("panel_table").rows.length;
        for (var i = rowCount - 1; i > 0; i--) {
            document.getElementById("panel_table").deleteRow(i);
        }
        $('#panel_table').hide();
    }

    $(document).on('click', '#id_selector_btn', function(){
        $('#id_selector_modal').modal('show');
    });

    
    // alert('hello');
    // alert(url_post_part_);

}