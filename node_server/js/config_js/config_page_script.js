document.body.className += ' ' + 'page-loading';
if( url_post_part_ && url_post_part_.indexOf('?') > -1)
    document.getElementById('config_page').src= 'http://' + root_ip + ':' + root_port + url_post_part_ +'&host=' + host_ + '&uid=' + uid_;
else
    document.getElementById('config_page').src = 'http://' + root_ip + ':' + root_port + '?host=' + host_ + '&uid=' + uid_;

function myFunction(){
    var configPageObj = document.getElementById('config_page');
    var configPageObjDocument = configPageObj.contentWindow.document;

    var dataObject = [], printable_data = {};
    if ( config_obj ) {
        var coj = $('<textarea />').html(config_obj).text();
        config_obj = JSON.parse( coj );
        $("#puppeteer_enabled").prop("checked", false);
        if ( config_obj.puppeteer_enabled )
            $("#puppeteer_enabled").prop("checked", true);
        dataObject = config_obj.data;
        mapConfig();
    }
    
    $('body').removeClass('page-loading');

    /* to extract and create a list of the element's attributes */
    function getAttr(ele){
        let temp = {};
        let arr  = [];
        let attrlist = ele.attributes;
        for(var i=0; i< attrlist.length; i++){
            if(attrlist[i].name != 'href' && attrlist[i].name.match('ng-') == null && attrlist[i].name != 'labelkey' && attrlist[i].name != 'style' && (attrlist[i].value !== '' && attrlist[i].value !== ' '))
                temp[attrlist[i].name] = attrlist[i].value.replace('option-selected', '').replace(/\s+$/, '');
        }
        return temp;
    }

    function mapConfig(){
        for(var obj of dataObject){
            if ('code_to_inject' in obj){
                var data_key = obj.key;
                var html = document.documentElement.innerHTML;
                printable_data[data_key] = eval('try {' + obj.code_to_inject + '}catch(err) {err.message}');
            }
            /* finding element via `id` */
            else if('id' in obj.attributes){
                var element = configPageObjDocument.getElementById(obj.attributes['id']);
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
        if ( _id ) {
            var targetElement = configPageObjDocument.getElementById( _id );
            mapConfigSelectElementCheck( targetElement, property_obj );
        }
        else{
            if ( property_obj.xpath ) {
                var targetElement = configPageObjDocument.evaluate( property_obj.xpath, configPageObjDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                mapConfigSelectElementCheck( targetElement, property_obj );
            }
        }
    }

    function mapConfigSelectElementCheck( targetElement, property_obj ){
        var currentElementAttr = getAttr( targetElement );
        var currentElementParentAttr = getAttr( targetElement.parentElement );
        var matchedStatus = false;

        if ( property_obj.parent_tag.toLowerCase() ==  targetElement.parentElement.tagName.toLowerCase()) {
            if ( property_obj.parent_xpath ==  getXPathAutoScraper( targetElement.parentElement )){
                matchedStatus = true;
                if ( currentElementAttr.id && property_obj.attributes.id){
                    matchedStatus = false;
                    matchedStatus = (currentElementAttr.id == property_obj.attributes.id )? true : false ;
                }
                if ( currentElementAttr.class && property_obj.attributes.class){
                    matchedStatus = false;
                    matchedStatus = (currentElementAttr.class == property_obj.attributes.class ) ? true : false ;
                }
                if ( currentElementParentAttr.class && property_obj.parent_attributes.class){
                    matchedStatus = false;
                    matchedStatus = (currentElementAttr.class == property_obj.attributes.class ) ? true : false ;
                }
                if ( currentElementParentAttr.id && property_obj.parent_attributes.id){
                    matchedStatus = false;
                    matchedStatus = (currentElementAttr.id == property_obj.attributes.id ) ? true : false ;
                }
            }
        }
        if ( matchedStatus )
            mapConfigSelectElementMapping( targetElement, property_obj );
    }

    function mapConfigSelectElementMapping( targetElement, property_obj ){
        var value = targetElement.src? targetElement.src.replace(re, ''): targetElement.textContent? targetElement.textContent.replace(/[\n\t\r]/g, '').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2').trim() : targetElement.value.replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2');
        targetElement.classList.add('option-selected');
        targetElement.setAttribute('labelkey', property_obj.key);
        $('#panel_table').show();
        $('#selected_props_list_tbody').append('<tr class="'+property_obj.key+'_tr"><td><span class="del_prop_btn" key="'+property_obj.key+'" path="'+property_obj.xpath+'" title="Remove this item">×</span></td><td>'+property_obj.key+'</td><td>'+value+'</td></tr>');
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

    $('#config_page').contents().find('head').append( '<style> .option-selected, .option-selected:hover { box-shadow: 0px 0px 0px 3px #529c56 inset !important; cursor: default; } .hover-selected{ box-shadow: 0px 0px 0px 1px #e42a78 inset !important;} </style>' );
    $('#config_page').contents().find('body').bind("click", clickevent);
    $('#config_page').contents().find('body').bind("contextmenu", rightclickevent);

    $('#config_page').contents().find('*').mouseover(function(event){
        if(event.target.className.indexOf('option-selected') < 0)
            event.target.classList.add('hover-selected');

        targetElement = event.target;
        if(event.target.closest(".avoid-ele") == null){
            $('#tag_info_block').show();
            var tag_info = '';
            if (targetElement.tagName.toLowerCase())
                tag_info += '<span class="_tag"><span style="color:#fff">Target - </span>'+ targetElement.tagName.toLowerCase()+'</span>';
            var targetElementClassList = Array.from(targetElement.classList);
            var index = targetElementClassList.indexOf('hover-selected');
            if (index > -1)
                 targetElementClassList.splice(index, 1);
            var index = targetElementClassList.indexOf('option-selected');
            if (index > -1)
                 targetElementClassList.splice(index, 1);

            if (targetElementClassList.length > 0)
                tag_info += ' | <span class="_class"><span style="color:#fff">Class - </span>'+ targetElementClassList + '</span>';
            if (targetElement.id)
                tag_info += ' | <span class="_id"><span style="color:#fff">Id - </span>'+ targetElement.id + '</span>';
            
            // tag_info += '<span class="tag_info_spliter">|</span>';
            // if (targetElement.parentElement.tagName.toLowerCase())
            //     tag_info += '<span class="_tag"><span style="color:#fff">Parent - </span>'+ targetElement.parentElement.tagName.toLowerCase()+'</span>';
            // if (targetElement.parentElement.classList.length > 0)
            //     tag_info += ' | <span class="_class"><span style="color:#fff">Class - </span>'+ targetElement.parentElement.classList + '</span>';
            // if (targetElement.parentElement.id)
            //     tag_info += ' | <span class="_id"><span style="color:#fff">Id - </span>'+ targetElement.parentElement.id + '</span>';
            
            $('#tag_info').html( tag_info );
        }
        else{
            $('#tag_info_block').hide();
            $('#tag_info').html('');
        }
    });

    $('#config_page').contents().find('*').mouseout(function(event){
        event.target.classList.remove('hover-selected');
        $('#tag_info_block').hide();
        $('#tag_info').html('');
    });

    function clickevent(event){
        event.preventDefault();
        targetElement = event.target;
        getXPath(event.target);
        checkForClass(event.target, event.pageX, event.pageY);
    }

    function rightclickevent(event){
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

    /* check whether an element is already selected or not */
    function checkForClass(targetElement, x, y){
        var classExistsFlag = checkElement(targetElement);
        if(classExistsFlag){                            /* if already selected, unselect it and don't display label input box */
            var _key = targetElement.getAttribute('labelkey');
            showMessage( _key, 'already selected, see record in table', 'danger' );
            dataHighlighter(_key);
        }else{                                          /* if not selected, select it and display the label input box, so that user can enter a label */
            let image   = (window.getComputedStyle(targetElement).backgroundImage);
            image       = image.substr(5, image.length-7);
            let replace = '(.)+' + root_port + '\/';
            let re      = new RegExp(replace, "g");
            let labelItemValue = '';
            if(image.length)
                labelItemValue = image;
            else if(targetElement.hasAttribute('src'))
                labelItemValue = targetElement.src.replace(re, ''); //targetElement.src.replace(/(.)+3002\//, '');
            else
                labelItemValue = targetElement.textContent.replace(/[\n\t\r]/g, '').replace(/\s\s+/g, ' ').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2');
            propertyBuilderWindow( labelItemValue );
        }
    }

    /* this function is called in checkForClass() [above] to check for class `option-selected` in the current element and its parents, in order to conclude whether it is already selected or not. [We add class `option-selected` on elements which are selected] A parent is also checked here so as to avoid selecting a child element if its immediate parent is already selected, having the same value*/
    function checkElement(childElement){
        var parentElement = childElement.parentElement;
        if(childElement.className.indexOf('option-selected') >= 0)
            return true;
        else if(parentElement.className && parentElement.className !== ''){
            if(parentElement.className.indexOf('option-selected') >= 0)
                return true
            else
                return false
        }else
            return checkElement(parentElement);
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
    function postElement(label, targetElement){
        let newDataObject = {};
        let child = targetElement;
        let i = 0;
        while( (child = child.previousSibling) != null ) // to get the index of the element in its parent's child list
            i++;
        label = label.trim().replace(/\s+/g, '_');

        if(document.getElementById('property_builder_advance_code') && document.getElementById('property_builder_advance_code').value){
            newDataObject["key"]    = label;
            newDataObject["code_to_inject"] = document.getElementById('property_builder_advance_code').value;
        }
        else{
            newDataObject["key"]    = label;
            newDataObject["tag"]    = targetElement.tagName.toLowerCase();
            newDataObject["xpath"]  = x_paths;
            newDataObject["attributes"] = getAttr(targetElement);
            newDataObject["children"]   = targetElement.childElementCount;
            newDataObject["child_index"]= i;
            
            var temp_parent_xpath   =  x_paths.split('/');
            temp_parent_xpath.pop();
            newDataObject["parent_xpath"]       = temp_parent_xpath.join('/');
            newDataObject["parent_attributes"]  = getAttr(targetElement.parentElement);
            newDataObject["parent_tag"]         = targetElement.parentElement.tagName.toLowerCase();    
        }
        dataObject.push(newDataObject)
        console.log("data[insert]: ", dataObject)

        /*Display selected item in panel*/
        if(document.getElementById('property_builder_advance_code') && document.getElementById('property_builder_advance_code').value){
            var html = document.documentElement.innerHTML;
            var res = eval('try {' + document.getElementById('property_builder_advance_code').value + '}catch(err) {err.message}');
            var display_selected_list = '<tr class="'+label+'_tr"><td><span class="del_prop_btn" key="'+label+'" path="'+x_paths+'" title="Remove this item">×</span></td><td>'+label+'</td><td>'+ res +'</td></tr>';
        }
        else if(document.getElementById('id_selector_ele_id') && document.getElementById('id_selector_ele_id').value){
            var display_selected_list = '<tr class="'+label+'_tr"><td><span class="del_prop_btn" key="'+label+'" path="'+x_paths+'" title="Remove this item">×</span></td><td>'+label+'</td><td>'+configPageObjDocument.getElementById(document.getElementById('id_selector_ele_id').value).textContent.replace(/[\n\t\r]/g, '').replace(/\s\s+/g, ' ').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2'); +'</td></tr>';
        }
        else{
            var display_selected_list = '<tr class="'+label+'_tr"><td><span class="del_prop_btn" key="'+label+'" path="'+x_paths+'" title="Remove this item">×</span></td><td>'+label+'</td><td>'+document.getElementById('property_builder_value').value+'</td></tr>';
        }

        $('#panel_table').show();
        $('#selected_props_list_tbody').append(display_selected_list);
        showMessage( label, 'label successfuly added, see record in table', 'success' );
        dataHighlighter(label);
    }

    function selectElement(path, label){
        key_flag = false;
        for(var x=0; x< dataObject.length; x++){
            if(dataObject[x]["key"] === label){
                key_flag = true;
                showMessage( label, ' is duplicate name, see record in table', 'danger' );
                dataHighlighter(label);
            }
        }
        if(!key_flag){
            console.log(path);
            var targetElement = configPageObjDocument.evaluate( path, configPageObjDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            targetElement.classList.add('option-selected');
            targetElement.setAttribute('labelkey', label);
            postElement(label, targetElement);
        }
    }

    function unselectElement(key){
        for(var i=0; i<dataObject.length; i++){
            if(dataObject[i].key === key)
                dataObject.splice(i,1);
        }
    }
    /* function for lable input `OK` button*/
    function propertyBuilderWindow( labelItemValue ){
        $.confirm({
            title: 'Property Builder',closeIcon: true,animation: 'top', boxWidth: '300px',useBootstrap: false,
            content: '' +
            '<form action="" class="formName">' +
                '<div class="form-group">' +
                    '<label class="advance-mode"  title="Enable advance mode for regex code"><input name="add_mode" class="add_mode" value="" type="checkbox"> Advance mode </label>'+
                '</div>' +
                '<div class="form-group">' +
                    '<input class="form-control" name="property_builder_text" type="text" maxsize="30" title="Property Name" placeholder="Property Name" id="property_builder_text" />' +
                '</div>' +
                '<div>' +
                    '<textarea class="form-control" id="property_builder_value" title="Property Content" disabled="">'+ labelItemValue +'</textarea>'+
                    '<textarea class="form-control" id="property_builder_advance_code" title="Advance Code" placeholder="JS Code" ></textarea>'+
                '</div>' +
            '</form>',
            buttons: {
                somethingElse: {
                    text: 'OK !',
                    btnClass: 'btn-red ok-btn',
                    keys: ['enter'],
                    action: function(event){
                        let label = document.getElementById('property_builder_text').value;
                        if ( label ) {
                            _propertyBuilderOkBtn(event);    
                        }
                        else{
                            return false;
                        }
                    }
                }
            }
        });
    }

    function _propertyBuilderOkBtn(event){
        let label = document.getElementById('property_builder_text').value;
        label = label.trim().replace(/\s+/g, '_');

        if(label != '')
            selectElement(x_paths, label);
    }
    $(document).on('click', '#create_config', function(event){
        $.confirm({
            title: 'Confirm!',
            icon: 'fa fa-warning',
            content: 'Save Config & Close the window',
            buttons: {
                confirm: {
                    text: 'Confirm',
                    btnClass: 'btn-success mr-10',
                    keys: ['enter'],
                    action: function(){
                        var puppeteerEnabled = false;
                        if($('#puppeteer_enabled').is(':checked'))
                            var puppeteerEnabled = true;

                        if (dataObject.length > 0) {
                            var data = {
                                data: dataObject,
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
                                var ww = window.open('', '_self'); ww.close();
                            })
                        }
                        else{
                                $.alert({
                                    title: 'Alert!',
                                    icon: 'fa fa-warning',
                                    content: 'Can\'t Create blank config',
                                });
                        }
                    }
                },
                cancel: {
                    text: 'Cancel',
                    btnClass: 'btn-danger',
                    keys: ['esc'],
                    action: function(){}
                }
            }
        });
        
    });

    $(document).on('click', '.del_prop_btn', function(){
        var _key = this.getAttribute('key');
        var _path = this.getAttribute('path');
        unselectElement(_key);
        var obj_to_del = configPageObjDocument.evaluate( _path, configPageObjDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        obj_to_del.classList.remove('option-selected');
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
        dataObject = [];
        var selected_items = configPageObjDocument.getElementsByClassName('option-selected');
        if(selected_items.length > 0)
            while(selected_items.length)
                selected_items[0] = selected_items[0].classList.remove('option-selected');
        resetConfigurationPanelData();
    });

    function resetConfigurationPanelData(){
        showMessage('', '<strong>All records are delete.</strong>', 'success');
        var rowCount = document.getElementById("panel_table").rows.length;
        for (var i = rowCount - 1; i > 0; i--)
            document.getElementById("panel_table").deleteRow(i);
        $('#panel_table').hide();
    }

    $(document).on('click', '#id_selector_btn', function(){
        $.confirm({
            title: 'ID Selector',closeIcon: true,animation: 'top', boxWidth: '300px',useBootstrap: false,
            content: '' +
            '<form action="" class="formName">' +
                '<div class="form-group">' +
                    '<input class="form-control" type="text" maxsize="30" placeholder="Property Name" id="id_selector_ele_key" />' +
                '</div>' +
                '<div><input class="form-control" type="text"  placeholder="Target Element Id"name="id_selector_ele_id" id="id_selector_ele_id"/></div>'+
            '</form>',
            buttons: {
                somethingElse: {
                    text: 'OK !',
                    btnClass: 'btn-red ok-btn',
                    keys: ['enter'],
                    action: function(event){
                        let label = document.getElementById('id_selector_ele_key').value;
                        let idSelectorText = document.getElementById('id_selector_ele_id').value;
                        let targetElement_ = configPageObjDocument.getElementById( idSelectorText );
                        console.log( targetElement_);
                        label = label.trim().replace(/\s+/g, '_');
                        if ( label != '' && targetElement_) {
                            getXPath( targetElement_ );
                            selectElement( x_paths, label );
                        }
                        else{
                            return false;
                        }
                    }
                }
            }
        });
    });
    
    $(document).on('click', '.add_mode', function(){
        var _key = this.getAttribute('key');
        if($(this).is(":checked")){
            $('#property_builder_value').hide();
            $('#property_builder_advance_code').show();
            showMessage( _key, 'Advance mode for this key successfuly enabled', 'success' );
        }
        else{
            $('#property_builder_value').show();
            $('#property_builder_advance_code').hide();
            showMessage( _key, 'Advance mode for this key successfuly disabled', 'danger' );
        }
    });
}