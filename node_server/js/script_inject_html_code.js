var cm = '';        //contextmenu
var lpt = '';       //labelinput
var pl = '';        //panel
var ta = '';        //top alerts
var hb = '';        //help_block

//contextmenu
cm = '<div id="context" class="avoid-ele">';
  cm += '<div id="context_header">Config Panel <span class="close-btn_" title="close">&times;</span></div>';
  cm += '<div id="context_body">';
    cm += '<ul>';
      cm += '<li>';
        cm += '<div class="form-check">';
          cm += '<label class="form-check-label">';
            cm += '<input class=" perform_action" type="button" rel="selection_reset" name="selection_reset" id="selection_completed" value="Reset selection">';
            cm += '<input class=" perform_action" type="button" rel="done_config" name="done_config" id="done_config" value="Create config">';
            cm += '<input class=" perform_action" type="button" rel="select_id" name="select_id" id="select_id" value="Enter ID selector">';
            cm += '<input class="block sm-col-4 field-light h3 label_input" style="display:none;" type="text" name="id_selector_text" placeholder="Input selector and press `Enter`" id="id_selector_text" />';
          cm += '</label>';
        cm += '</div>';
      cm += '</li>';
    cm += '</ul>';
  cm += '</div>';
cm += '</div>';

//labelinput
lpt = '<div id="label_input" class="avoid-ele">';
  lpt += '<div id="label_input_header">Property Builder <span class="close-btn_" title="close">&times;</span></div>';
  lpt += '<div id="label_input_body">';
    lpt += '<label class="advance-mode" title="Enable advance mode for regex code">';
      lpt += '<input name="add_mode" class="add_mode" value="" type="checkbox"> Advance mode';
    lpt += '</label>';
    lpt += '<ul>';
      lpt += '<li>';
        lpt += '<div class="form-check">';
          lpt += '<label class="form-check-label">';
            lpt += '<form class="form-inline" id="label_input_form">';
              lpt += '<input class="block sm-col-4 field-light h3 label_input" name="label_input_text" type="text" maxsize="30" title="Property Name" placeholder="property name" id="label_input_text" />';
              lpt += '<textarea disabled class="block sm-col-4 field-light h3" id="label_item_value" title="Property Content"></textarea>';
              lpt += '<textarea class="" name="label_input_text" placeholder="JS Code" id="advance_code_input_text"></textarea>';
              lpt += '<input class="perform_action" type="button" id="label_input_button" value="OK!">';
            lpt += '</form>';
          lpt += '</label>';
        lpt += '</div>';
      lpt += '</li>';
    lpt += '</ul>';
  lpt += '</div>';
lpt += '</div>';

//panel
pl += '<div id="panel" class="avoid-ele">';
  pl += '<div id="panelheader">Configuration Panel <span id="panelmm" title="Click & Drag"></span></div>';
  pl += '<div id="panelbody">';
    pl += '<button id="help-btn">Need Help ?</button>';
    pl += '<input class=" perform_action" type="button" rel="done_config" name="done_config" id="done_config" title="First creates property" disabled value="Create config">';
    pl += '<input class=" perform_action" type="button" rel="select_id" name="select_id" id="select_id" title="Enter ID selector" value="Enter ID selector">';
    pl += '<input class="block sm-col-4 field-light h3 label_input" style="display:none;" type="text" name="id_selector_text" placeholder="Input selector and press `Enter`" id="id_selector_text" />';
  pl += '</div>';
  pl += '<div id="panelfooter">';
    pl += '<table id="panel-table">';
      pl += '<thead id="panel-table-thead">';
        pl += '<tr><th><span id="selection_completed" title="Remove All items">×</span></th><th>Property</th><th>Property Content</th></tr>';
      pl += '</thead>';
      pl += '<tbody id="selected_elements_list"></tbody>';
    pl += '</table>';
  pl += '</div>';
pl += '</div>';

//top alerts
ta += '<div class="msg-panel avoid-ele"></div>';

//help_block
hb += '<div id="help_block" class="help-block avoid-ele">';
  hb += '<div id="help-modal" class="modal">';
    hb += '<div class="modal-content">';
      hb += '<div class="modal-header"><span class="close-help-modal">&times;</span><h3>Help </h3></div>';
      hb += '<div class="modal-body">';
        hb += '<ul>';
          hb += '<li>Left Click: click on the element to select and label it accordingly</li>';
          hb += '<li>Please left click on the element to select and label it accordingly</li>';
          hb += '<li>Right click to perfom action</li>';
        hb += '</ul>';
      hb += '</div>';
    hb += '</div>';
  hb += '</div>';
hb += '</div>';


document.body.innerHTML +=  lpt + pl + ta + hb;