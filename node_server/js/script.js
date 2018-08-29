document.addEventListener("DOMContentLoaded", function(event) { 

    var data_object = [], printable_data = {};

    //if config exists and it is a data scraping request
    var getScriptWithJson = document.querySelector('#scriptNodeWithJson');//we inject this information through client.js
    if(getScriptWithJson){
        data_object = JSON.parse(document.querySelector('#scriptNodeWithJson').innerHTML).data;
        //call function for auto scraping
        autoDetect();
        
    }

    //if it is an analysis request
    var analyzeFlag = document.getElementById('rtech_analyze').innerHTML; //we inject this information through server.js
    if(analyzeFlag === 'true'){
        //this function gets a html page from server which is then displayed on browser with information/analysis of  request-response
        setTimeout(() => {
               fetch('/rtech/api/get_analysis', {
                method: 'GET'
                })
                .then(response => response.text())
                .then(data => {document.open(); document.write(data); document.close();})
        },15000)
    }
		
/*_________________________for initializing required objects and functions_________________________________*/ 	
	
    /*adding event handelors to javascript events*/
    document.addEventListener("keyup", keyupevent); //for removing context menu on `esc` button
    document.getElementById("enable_right_click").addEventListener("click", clickevent) //for clicking on left-click-menu items
    document.getElementById("enable_right_click").addEventListener("contextmenu", rightclickevent)  //for right click menu
    document.getElementById("enable_right_click").addEventListener("mouseover", mouseoverevent);    //for hover event
    document.getElementById("enable_right_click").addEventListener("mouseout", mouseoutevent);  //for hover event
    document.querySelectorAll(".perform_action").forEach(function(ele){ //for clicking on right-click-menu items
        ele.addEventListener("click", contextmenuclick);
    })
    document.getElementById("label_input_button").addEventListener("click", labelbuttonclick)   //for left click menu
    
    /* function for removing context menu on `esc` button*/
    function keyupevent(event){
        console.log('keyboard')
        if(event.keyCode === 27){
            
            document.getElementById('context').style.display = 'none';
            document.getElementById('label_input').style.display = 'none';
        }else if(event.keyCode === 13 && event.target.name === 'id_selector_text'){
            
            let selector_ = document.querySelector('#id_selector_text').value;
            if(document.querySelector(selector_)){
                document.getElementById('id_selector_text').setAttribute('style', 'display: none;');

                let target_ = document.querySelector(selector_);

                getXPath(target_);
                selectElement(x_paths, '_ID'); 
            }else{
                document.getElementById('id_selector_text').value='';
                document.getElementById('id_selector_text').setAttribute('placeholder','Invalid selector');
            }
        }
    }

    /* function for lable input `OK` button*/
    function labelbuttonclick(event){
        event.preventDefault();
        event.stopPropagation();

        let label = document.getElementById('label_input_text').value;

        if(label != '')
        	selectElement(x_paths, label);

	}

    /* function for handeling clicks on left-click-menu items */
    function clickevent(event){
        //the elemnts on which the left click functionality (of showing label input box) should not work
        var avoid_element_id = ['label_input_text', 'label_input_button', 'selection_completed', 'done_config', 'select_id', 'id_selector_text']
        
        if(avoid_element_id.indexOf(event.target.getAttribute('id')) === -1){
            if(document.getElementById("context").style.display === 'block'){
                document.getElementById("context").style.display = "none";
            }
        
            document.getElementById('label_input_text').value = '';
            document.getElementById('label_input_text').setAttribute('placeholder','Label');
            
            getXPath(event.target);
            checkForClass(x_paths, event.pageX, event.pageY); 
        }        
    }

    /* function for displaying rightclick menu */
    function rightclickevent(event){
        if(document.getElementById("label_input").style.display === 'block'){
            document.getElementById("label_input").style.display = "none";
        }

        event.preventDefault();
        document.getElementById('id_selector_text').setAttribute('style', 'display:none;');
        document.getElementById('id_selector_text').value = '';
        document.getElementById('context').setAttribute('style', 'display:block; left:'+event.pageX+'px;top:'+event.pageY+'px;');
    }

    /* function for adding border on hover */
    function mouseoverevent(event){
        if(event.target.className.indexOf('option-selected') < 0){
            event.target.classList.add('hover-selected');
        }
    }

    /* function for removing border on hover out */
    function mouseoutevent(event){
        event.target.classList.remove('hover-selected');
    }

    /* function for handeling clicks on right-click-menu items */
    function contextmenuclick(event){
        console.log('context menu clicked')
        let action = event.target.getAttribute('rel');
        
        if(action === 'selection_reset'){
            localStorage.removeItem('data');
            localStorage.removeItem('detailpageflag');
            data_object = [];

            var selected_items = document.getElementsByClassName('option-selected');
            if(selected_items.length > 0)
	            while(selected_items.length)
	            	selected_items[0] = selected_items[0].classList.remove('option-selected');

            document.getElementById('context').style.display = 'none';
	    }else if(action === 'selection_type'){

            localStorage.setItem('detailpageflag', '1');
            document.getElementById('context').style.display = 'none';
        }else if(action === 'done_config'){
            
            var url = window.location.search.split("&")[window.location.search.split("&").length - 1].replace("host=",'');
            var data = {
                data: data_object,
                url: url
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
            document.getElementById('context').style.display = 'none';
        }else if(action === 'select_id'){
            document.getElementById('id_selector_text').setAttribute('style', 'display: block;')
        }        

        // document.getElementById('context').style.display = 'none';
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
        x_paths = getElementXPath(element);
    }
/*_________________________for scraping detailed page______________________________________________________*/

	/* check whether an element is already selected or not */
    function checkForClass(path = x_paths, x, y){
        var targetelement = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; 
        var classexistsflag = checkElement(targetelement);

        if(classexistsflag){
            /* if already selected, unselect it and don't display label input box */
            document.getElementById('label_input').style.display = 'none';
            targetelement.classList.remove('option-selected');
            unselectElement(targetelement.getAttribute('labelkey'));
        }else{
            /* if not selected, select it and display the label input box, so that user can enter a label */
            document.getElementById('label_input').setAttribute('style', 'display:block; left:'+x+'px;top:'+y+'px;');
            document.getElementById('label_item_value').setAttribute('class','textareabox');

            //for cases like one in `https://www.airbnb.co.in/rooms/20814508` where the <div> contains the image url in its `style` property
            let image   = (window.getComputedStyle(targetelement).backgroundImage);
            image       = image.substr(5, image.length-7);

            let replace = '(.)+'+config.root_port+'\/';     
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

	/* this function is used to select an element and add class `option-selected` and an attribute `labelkey` to it. `labelkey` acts as the key in our `data_object` and this attribute helps us in removing the element from selection in case of unselecting an element*/
    function selectElement(path, label){
        key_flag = false;
    	for(var x=0; x< data_object.length; x++){
    		if(data_object[x]["key"] === label){
    			key_flag = true;
    			document.getElementById('label_input').setAttribute('color','red');
    			document.getElementById('label_input_text').value = '';
    			document.getElementById('label_input_text').setAttribute('placeholder','Key already exists');
    		}
    	}
    	if(!key_flag){
    		var targetelement = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	        targetelement.classList.add('option-selected');
	        targetelement.setAttribute('labelkey', label);
	        postElement(label, targetelement);
    	}
    }

    /* this function is used to extract selected element's properties and push it in our final `data_object` */
    function postElement(label, targetelement){
        let newdataobject        = {};
        let child = targetelement;
        let i = 0;
        while( (child = child.previousSibling) != null ) // to get the index of the element in its parent's child list
            i++;
        
        newdataobject["key"]	= label;
        // newdataobject["value"]	= targetelement.textContent.replace(/[\n\t\r]/g, '').replace(/\s\s+/g, ' ');
        newdataobject["tag"]    = targetelement.tagName.toLowerCase();
        newdataobject["xpath"]	= x_paths;
        newdataobject["attributes"]	= getAttr();
        newdataobject["children"]	= targetelement.childElementCount;
        newdataobject["child_index"]= i;
        
        var temp_parent_xpath	=  x_paths.split('/');
        	temp_parent_xpath.pop();
        newdataobject["parent_xpath"]		= temp_parent_xpath.join('/');
        newdataobject["parent_attributes"]  = getAttr(targetelement.parentElement);
        newdataobject["parent_tag"]         = targetelement.parentElement.tagName.toLowerCase();
        
        data_object.push(newdataobject)
        console.log("data[insert]: ", data_object)
        
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
        document.getElementById('label_input').style.display = 'none';
        document.getElementById('label_input_text').value = '';
    }

    /* this function is used to remove an element from `data_object` when we unselect it */
    function unselectElement(key){
        for(var i=0; i<data_object.length; i++){
            if(data_object[i].key === key)
                data_object.splice(i,1);
        }
        console.log("data[delete]: ", data_object)
    }
/*_________________________for auto scraping detailed page_________________________________________________*/
    function autoDetect(){
        /* for auto parsing, first we parse the `data_object` which contains the saved config data */
		for(var obj of data_object){
			var element_attributes	= obj.attributes;
			var element_key	= obj.key;
			var element_xpath	= obj.xpath;
			var element_tag = obj.tag;
            var element_index = obj.child_index;

			var parent_attributes	= obj.parent_attributes;
			var parent_xpath= obj.parent_xpath;
            var parent_tag  = obj.parent_tag;
			var element_flag = false;
			
			/* finding element via `id` */
			if('id' in element_attributes){
				var element = document.getElementById(element_attributes['id']);
				if(element){
					element_flag = true;
					autoSelectElement(element, element_key, element_xpath);
					continue;
				}
			}else{
				var condition_string = '';
				for(var attribute in  element_attributes){
                    if(element_attributes[attribute] !== '')
                        condition_string += '['+attribute+'="'+element_attributes[attribute]+'"]';
				}
                if(condition_string != ''){
					var candidate_elements 	= document.querySelectorAll(element_tag+condition_string+'');
                    var candidate_parent 	= returnparent(parent_attributes, parent_xpath, parent_tag);
					if(candidate_elements.length === 1 && candidate_elements[0] != null){
						element_flag = true;
						autoSelectElement(candidate_elements[0], element_key, element_xpath);
					}else if(candidate_elements.length > 1){
						var candidate_parent = returnparent( parent_attributes, parent_xpath, parent_tag);
						for(var x=0; x< candidate_elements.length; x++){
							if(candidate_elements[x].parentElement === candidate_parent){
								element_flag = true;
								autoSelectElement(candidate_elements[x], element_key, element_xpath);
								break;
							}
						}
					}else{
						candidate_element = document.evaluate(element_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
						if(candidate_element != null){
							element_flag = true;
							autoSelectElement(candidate_element, element_key, element_xpath);
						}
					}
				}else{
                    var candidate_parent = returnparent( parent_attributes, parent_xpath, parent_tag);

                    //check if parent attributes in config is equal to candidate parents extracted attributes
                    if(candidate_parent && JSON.stringify(postGetAttr(candidate_parent)) === JSON.stringify(parent_attributes)){
                        var candidate_element = candidate_parent.childNodes[element_index];
                        autoSelectElement(candidate_element, element_key, element_xpath);
                    }
                    
                }
			}
			
			if(element_flag === false){
				var candidate_element = document.evaluate(element_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				if(candidate_element != null){
					var candidate_parent = returnparent(parent_attributes, parent_xpath, parent_tag);
					if(candidate_parent && candidate_parent == candidate_element.parentElement){
						element_flag = true;
						autoSelectElement(candidate_element, element_key, element_xpath);
					}
					
				}
			}
		}        
	}

	function returnparent(attributes, xpath, tag){
		var selected_parent;

		/* if parent has `id` */
		if(attributes['id']){
			
			selected_parent = document.getElementById(attributes['id']);
			if(selected_parent != null){
				return selected_parent;
			}else{
				//if an id is contains a dynamically generated enitity
				var temporary_id_container = attributes['id'];
				var split_id = temporary_id_container.split(/([0-9]+)/g);
				for(var x=0; x< split_id.length; x++){
					var candidate_parent = document.querySelector('*[id*="'+split_id[x]+'"]');
					if(candidate_parent)
						return candidate_parent
				}
			}
			
		}

		/* if parent has `class` */
		if(attributes['class']){
			
			var candidate_parents = document.getElementsByClassName(attributes['class']);
			if(candidate_parents.length > 0)
				for(var i=0; i< candidate_parents.length; i++){
					var candidate_parent = candidate_parents[i];
					var candidate_parent_xpath = getXPathAutoScraper(candidate_parent);
					if(candidate_parent_xpath == xpath){
						selected_parent = candidate_parent;
						return selected_parent;
					}
				}
		}

		/* if parent has attributes other than `id` and `class` */
		var condition_string = '';
		for(var attribute in  attributes){
			condition_string += '['+attribute+'="'+attributes[attribute]+'"]';
		}
		if(condition_string != ''){
			var candidate_parent = document.querySelector(tag+condition_string);
			if(candidate_parent != null){
				var candidate_parent_xpath = getXPathAutoScraper(candidate_parent);
				if(candidate_parent_xpath == xpath){
					selected_parent = candidate_parent;
					return selected_parent;
				}else{
					var candidate_parent_xpath2	= candidate_parent_xpath.replace(/\[|\]|[1-9]+/g,'');
					var xpath2 	= xpath.replace(/\[|\]|[1-9]+/g,'');
					if(candidate_parent_xpath2 === xpath2){
						selected_parent = candidate_parent;
						return selected_parent;
					}
				}
			}
			candidate_parent = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
			if(candidate_parent != null)
				selected_parent = candidate_parent;
		}else{
            var candidate_parent = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if(candidate_parent && candidate_parent.tagName === tag.toUpperCase()){
                return candidate_parent;
            }
        }
		return selected_parent;
	}

    /*to get the attributes of an element*/
    function postGetAttr(ele){
        let temp = {};
        let arr  = [];
        let attrlist = ele.attributes;
        for(var i=0; i< attrlist.length; i++){
            if(attrlist[i].name != 'href' && attrlist[i].name.match('ng-') == null && attrlist[i].name != 'labelkey' && attrlist[i].name != 'style' && (attrlist[i].value !== '' && attrlist[i].value !== ' '))
                temp[attrlist[i].name] = attrlist[i].value.replace('option-selected', '').replace(/\s+$/, '');
        }
        return temp;
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

	/* select element */
	function autoSelectElement(ele, label, path){
		var targetelement = ele;
		targetelement.classList.add('option-selected');
		targetelement.setAttribute('labelkey', label);
		autoPostElement(label, targetelement, path);
	}

	/* extract selected element's properties */
	function autoPostElement(label, targetelement, path){
        
        //for cases like one in `https://www.airbnb.co.in/rooms/20814508` where the <div> contains the image url in its `style` property
        let image   = (window.getComputedStyle(targetelement).backgroundImage);
        image       = image.substr(5, image.length-7);

        let replace = '(.)+'+config.root_port+'\/';     
        let re      = new RegExp(replace, "g");

        if(image.length)
            printable_data[label] = image;
        else
            printable_data[label] = targetelement.src? targetelement.src.replace(re, ''): targetelement.textContent? targetelement.textContent.replace(/[\n\t\r]/g, '').replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2').trim() : targetelement.value.replace(/([a-z]{1})([A-Z]{1})/g, '$1, $2');

        console.log(label, printable_data[label])
    }
/*_________________________for sending scraped data____________________________________________________*/
	
    if(data_object.length > 0){
        var host    = window.location.search.split("&")[window.location.search.split("&").length - 1].replace("host=",'').replace(/_/g,'.');
        var url     = (window.location.href).replace(/\&*config(.)+/, '').replace(/^http(s)*\:\/\//, '').replace(config.root_ip+':'+config.root_port, host);
        // the below regex was removing all the query string from a href, and in cases like `https://www.youtube.com/watch?v=D5drYkLiLI8` we need them. Therefore above is the corrected regex.
        // var url     = (window.location.href).replace(window.location.search, '').replace(/^http(s)*\:\/\//, '').replace(config.root_ip+':'+config.root_port, host);
        
        var final_data_for_csv = {}
        for(var i=0; i< data_object.length; i++){
            if(data_object[i].key in printable_data){
                final_data_for_csv[data_object[i].key] = printable_data[data_object[i].key];
            }else{
                final_data_for_csv[data_object[i].key] = ' ';
            }
        }

        final_data_for_csv['url'] = url;

        var data = {
            data: [final_data_for_csv],
            url: window.location.search.split("&")[window.location.search.split("&").length - 1].replace("host=",'')
        }
        
        fetch('/rtech/api/get_config', {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json' 
            },
            method: 'POST'
        })
        .then(response => response.json())
        .then((res) => {
            var ww = window.open('', '_self'); ww.close();
        })
        .catch(function() {
            var ww = window.open('', '_self'); ww.close();
        });
    }

});