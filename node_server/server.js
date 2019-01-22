const express       = require('express');
const app           = express();
const util          = require('util');
const path          = require('path');
const fileSystem    = require('fs');
const cheerio       = require('cheerio');
const bodyParser    = require('body-parser');
const csv           = require('fast-csv');
const mysql         = require('mysql');
const request       = require('request-promise');
var viewPath = path.join(__dirname, 'views');

const header    = require(path.join(__dirname, 'js/headers'));          //code to clean our headers from invalid characters
const rtech_config  = require(path.join(__dirname, 'config/config'));   //application config
const connection    = mysql.createConnection({
                          host     : rtech_config.mysql_host,
                          user     : rtech_config.mysql_user,
                          password : rtech_config.mysql_password,
                          database : rtech_config.mysql_database
                      });
connection.connect();
app.set('views', viewPath);
app.set("view engine","pug");
//#================================================================CONFIGURING NODE `APP`
    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
     
    // parse application/json
    app.use(bodyParser.json({ limit: '50mb', extended: true }))

    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    // serve static files.
    app.use('/js', express.static(path.join(__dirname, 'js')));
    app.use('/css', express.static(path.join(__dirname, 'css')));
    app.use('/config', express.static(path.join(__dirname, 'config')));

//#================================================================

//#================================================================VARIABLE(S) DECLARATION
    var split_url       = '';
    var default_host    = '';
    var file_index      = 0;
    var use_ip          = rtech_config.root_ip + ':' + rtech_config.root_port;
    var jsonArrayFromGET= [];

    var server;
    // var scraping_status = {
    //  done: false,
    //  success: false
    // };
    var inject_code_flag = false;
    
    var HTTP_PREFIX     = "http://";
    var HTTPS_PREFIX    = "https://";
    var REL_PREFIX      = "//";
    var VALID_PREFIXES  = [HTTP_PREFIX, HTTPS_PREFIX, REL_PREFIX];
    var IGNORE_PREFIXES = ["#", "about:", "data:", "mailto:", "javascript:", "{", "*"];
    var parsedDataArray = [];
    var debugMode = true;
    var debugLogArr = [];
    var sess = {
        done: false,
        success: false
    };

//#================================================================
//#================================================================GET
    //this will send the sttaus of the scrapper, whether completed or not
    app.get('/config/*', (req, res) => {
        // const {config, host, uid, analyze}  = req.query;
        const { config, editmode, host, uid, url_post_part, prtocol } = req.query;
        if(config === 'true'){
            connection.query("select config from config_list where user_id= ? and config_name = ?", [uid, host], function (err, results, fields) {
                if (err){ 
                    console.log('Error connection.query select config : '+err);
                }else{
                    if(results.length){
                        var config_object = results[0].config;
                        res.render('config', { root_port: rtech_config.root_port, root_ip: rtech_config.root_ip, config: config, editmode: editmode, host: host, uid: uid, url_post_part: url_post_part, config_obj: config_object, protocol_: prtocol })
                    }
                }
            });
        }
        else{
            res.render('config', { root_port: rtech_config.root_port, root_ip: rtech_config.root_ip, config: config, editmode: editmode, host: host, uid: uid, url_post_part: url_post_part, protocol_: prtocol })
        }
    })
    
    app.post('/rtech/api/check_scrape', (req, res) => {     
        var user_id = req.body.user_id;     
        var logFileContent;
        var filename  = req.body.host_name+'_'+user_id;
        
        var tempDone = req.body.host_name+'_done';
        var tempSucess = req.body.host_name+'_success';

        var sess = readSession(user_id);
        console.log(sess);

        if(sess[tempDone] === true){
            if(sess[tempSucess]){
                //sess.done = false;
                //sess.success = false;                                             

                var scrapedData = [];
                if(fileSystem.existsSync(path.join(__dirname, 'storage/site_output/'+filename+'.json'))){
                    var scrapedDataTemp = fileSystem.readFileSync(path.join(__dirname, 'storage/site_output/'+filename+'.json'), 'utf8');
                    if(scrapedDataTemp){
                        try{
                            scrapedData = JSON.parse(scrapedDataTemp);
                        }
                        catch(e){
                            jsonArrayFromGET_Item['RES_body']    = JSON.parse('{}');
                        }
                    }
                    else{
                        jsonArrayFromGET_Item['RES_body']    = JSON.parse('{}');
                    }
                }else{
                    console.log("Data not found, may be something went wrong");
                }
                logFileContent = readLogFile(filename);             
                if (logFileContent){
                    fileSystem.unlinkSync(path.join(__dirname, 'storage/log/log_'+filename+'.txt'));            
                }

                if(fileSystem.existsSync(path.join(__dirname, 'storage/sess_dir/session_'+user_id+'.json'))) {
                    fileSystem.unlinkSync(path.join(__dirname, 'storage/sess_dir/session_'+user_id+'.json'));
                }

                if(fileSystem.existsSync(path.join(__dirname, 'storage/site_output/'+filename+'.json'))){
                    fileSystem.rename(path.join(__dirname, 'storage/site_output/'+filename+'.json'), path.join(__dirname, 'storage/history_data/'+filename+'.json'), function (err) {
                        if (err) throw err
                        //console.log('Successfully renamed')
                    })
                }       

                res.send({status: 200, message: 'scraping done', success: true, data: scrapedData, logs: logFileContent})
            }
            else{
                //sess.done = false;
                //sess.success = false;
                parsedDataArray = [];
                var temp_debugLogArr = debugLogArr;
                debugLogArr = [];
                logFileContent = readLogFile(filename);
                if (logFileContent){
                    fileSystem.unlinkSync(path.join(__dirname, 'storage/log/log_'+filename+'.txt'));            
                }               
                res.send({status: 200, message: 'scraping done', success: false, data:[], logs: temp_debugLogArr});
            }
        }else{
            var temp_debugLogArr = debugLogArr;
            debugLogArr = [];
            logFileContent = readLogFile(filename);
            if (logFileContent){
                fileSystem.unlinkSync(path.join(__dirname, 'storage/log/log_'+filename+'.txt'));            
            }           
            res.send({status: 500, message: 'scraping going on', data:[], logs: logFileContent});
        }
    })

    //this will send the analysis of request/reponse we have collected to analysis page
    app.get('/rtech/api/get_analysis_data', (req, res) => {
        res.send(jsonArrayFromGET);
    })

    //this will send the html we have created for analysis page
    app.get('/rtech/api/get_analysis', (req, res) => {
        res.sendFile('analyze.html', {root: __dirname })
    })

    //this will handle all the GET requests we have redirected from the website's page to our server
    app.get('/*', (req, res) => {

        const {headers, url, method} = req;
        const {config, host, uid, analyze}  = req.query;

        if(config){
            inject_code_flag = true;
        }else{
            inject_code_flag = false;
        }

        if(analyze){
            jsonArrayFromGET = [];
        }
        
        delete headers['host'];

        var complete_path   = '' + (url).replace(/(\?)*config=(.)+/, '');
        var new_url         = 'http://'+use_ip+'/';
        var target_url;

        if(host) { default_host = 'https://'+(host).replace(/_/g, '.') };
        if(complete_path && complete_path.startsWith('/http') === false) { if(!complete_path.startsWith(REL_PREFIX)) {target_url = default_host + complete_path} else {target_url = complete_path} }
            else if(complete_path && complete_path.startsWith('/http') === true){ target_url = complete_path.replace(/^\//, '') };
        
        var options = {
            headers: {
                    'connection': 'keep-alive',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko',
                    // 'Accept-Language': 'en-US,en;q=0.5', 
                },
            url: target_url,
            encoding: null,
            jar: true //keep the cookies during the redirects;this was included while parsing `https://www.ulta.com/dose-of-colors-x-iluvsarahii-highlighter?productId=xlsImpprod18811035` 
        }

        if(analyze && analyze == 'true'){
            sendRequest(req, res, host, uid, options, config, new_url, true);
        }else{
            sendRequest(req, res, host, uid, options, config, new_url, false);
        }
    })

//#================================================================


    async function getPage(data,url,user_id,req, res){
        //var final_url = '';
        console.log('pf - 2');
        //======================for the redirect urls=========================
        // function redirectOn302(body, response, resolveWithFullResponse) {
        //     console.log('pf - 3');
        //     if ( response.statusCode != 200 ) {
        //         console.log('pf - 4');
        //         // Set the new url (this is the options object)
        //         //this.url = response.['the redirect url somehow'];
        //         //console.log('1 : statusCode======='+response.statusCode);
        //         this.url = response.headers.location;
        //         var options = {
        //             url: response.headers.location,            
        //             resolveWithFullResponse : true,
        //             transform: redirectOn302            
        //         };
        //         return request(options).then(function(body){
        //             console.log('pf - 5');
        //             //console.log('body+++++++'+body);
        //             }).catch(function(err){
        //             console.log(err);
        //         });
        //     } else {
        //         console.log('pf - 6');
        //         return resolveWithFullResponse ? response : body;
        //     }
        // }
        //======================================================================

        var options = {
            url: url,
            resolveWithFullResponse : true,
            //transform: redirectOn302            
        };
        console.log('url - ',url);
        request(options, function(error, response, body){
            console.log('pf - 7');
            if (!error && response && response.statusCode ) {
                console.log('pf - 8');
                var url_ = response.request.uri.href;
                var filename_ = (url_.split('/'))[2].replace(/\./g,'_');
                var temp= {};
                temp[filename_+'_success']  = false;
                temp[filename_+'_done']  = false;

                writeSession(user_id, temp);

                //console.log(sess);        
                if(data.url_list.length>0){
                    console.log('pf - 9');
                    var split_ar = url_.split('/');
                    var host_url = split_ar[0] + '//' + split_ar[2];
                    var config_exist;

                    var array_received = (data.url_list).join('\r\n');
                    //save list in db
                    fileSystem.writeFile(path.join(__dirname, 'storage/product_url/'+filename_+'_'+user_id+'_url_list_.txt'), array_received, 'utf-8', function(err) {
                        if(err) {
                            console.log('pf - 10');
                            res.send({status: 500, file_location: err, 'process_host_name':filename_ , 'extracted_host_name':host_url });
                        }
                    });
                    connection.query("select id from config_list where user_id= ? and config_name = ?", [user_id, filename_], function (err, results, fields) {
                        //if (error) throw error
                        console.log('pf - 11');
                        config_exist = false;
                        if (err){ 
                            console.log('pf - 12');
                            console.log('Error connection.query : '+err);
                        }else{
                            console.log('pf - 13');
                            if(results.length){
                                console.log('pf - 14');
                                config_exist = true;
                                res.send({status: 200, file_location: 'storage/product_url/'+filename_+'_'+user_id+'_url_list_.txt', file_content: array_received, 'config_exist':config_exist,'process_host_name':filename_ , 'extracted_host_name' : host_url, 'actual_url' : url_ });
                            }else{
                                console.log('pf - 15');
                                if (fileSystem.existsSync(path.join(__dirname, 'storage/global_config/'+filename_+'.json'))) {
                                    console.log('pf - 16');
                                    var scrapedContent = fileSystem.readFileSync(path.join(__dirname, 'storage/global_config/'+filename_+'.json'), 'utf8');
                                    scrapedContent = JSON.parse(scrapedContent);
                                    scrapedContent.user_id = user_id;
                                    console.log("Trying to save config");
                                    var data = {'user_id': user_id, 'config_name': filename_, 'config': JSON.stringify(scrapedContent)};
                                    connection.query("INSERT INTO config_list SET ?", data, function (err, results, fields) {
                                        //if (error) throw error
                                        if (err) {
                                            console.log('pf - 17');
                                            console.log('Error connection.query tey to insert config into DB: '+err);
                                            res.send({status: 500, file_location: err, 'process_host_name':filename_ , 'extracted_host_name':host_url });
                                        }else{
                                            console.log('pf - 18');
                                            config_exist = true;
                                            res.send({status: 200, file_location: 'storage/product_url/'+filename_+'_'+user_id+'_url_list_.txt', file_content: array_received, 'config_exist':config_exist,'process_host_name':filename_ , 'extracted_host_name' : host_url, 'actual_url' : url_ });
                                        }
                                    });
                                }
                                else{
                                    console.log('pf - 19');
                                    res.send({status: 200, file_location: 'storage/product_url/'+filename_+'_'+user_id+'_url_list_.txt', file_content: array_received, 'config_exist':config_exist,'process_host_name':filename_ , 'extracted_host_name' : host_url, 'actual_url' : url_ });
                                }
                            }
                        }
                    });
                }
                else{
                    console.log('pf - 20');
                    res.send({status: 500, file_location: err});
                }                
            }
            else{
                console.log('pf - 21');

                console.log('response.statusCode - ',response);
                console.log('error - ',error);
                
            }
        });
    }
//#================================================================GET REQUEST HANDLER
    async function sendRequest(req, res, host, uid, options, config, new_url, analyze){
        var headers, obj;
        var final_url = '';
        //======================for the redirect urls=========================
        function redirectOn302(body, response, resolveWithFullResponse) {
            console.log('Calling function redirectOn302');
            console.log('1 : statusCode======='+response.statusCode);
            // if (response.statusCode == 302 ) {
            //     // Set the new url (this is the options object)
            //     //this.url = response.['the redirect url somehow'];
            //     //console.log('1 : statusCode======='+response.statusCode);
            //     this.url = response.headers.location;
            //     var options = {
            //         url: response.headers.location,            
            //         resolveWithFullResponse : true,
            //         transform: redirectOn302            
            //     };        
            //     return request(options).then(function(body){
            //         //console.log('body+++++++'+body);
            //         }).catch(function(err){
            //         console.log(err);
            //     });
            // } else {
            //     return resolveWithFullResponse ? response : body;
            // }
            if ( response.statusCode != 200 ) {
                // Set the new url (this is the options object)
                //this.url = response.['the redirect url somehow'];
                //console.log('1 : statusCode======='+response.statusCode);
                this.url = response.headers.location;
                var options = {
                    url: response.headers.location,            
                    resolveWithFullResponse : true,
                    transform: redirectOn302            
                };        
                return request(options).then(function(body){
                    //console.log('body+++++++'+body);
                    }).catch(function(err){
                    console.log(err);
                });
            } else {
                return resolveWithFullResponse ? response : body;
            }
        }
        //======================================================================

        if(options['url'].indexOf('https') === -1){
            options['url'] = options['url'].replace('http', 'https')
        }

        if(options['url'].match(/\/\/\//)){
            options['url'] = options['url'].replace(/\/\/\//, '//')
        }

        if(options['url'].startsWith(REL_PREFIX)){
            options['url'] = 'https:' + options['url']
        }

        //options['proxy'] = 'http://207.180.240.16:3128';        
             
        options['resolveWithFullResponse'] = true;
        
        //options['proxy'] = 'http://doug:vgK4PbpY@172.84.85.127:60099';
        options['transform'] = redirectOn302;
        
        request(options, function(error, response, body){            
            
            //console.log('2 : statusCode======='+response.statusCode);

            if (!error && response.statusCode == 200) {            
                // console.log('++++++++++++++++++++++++++++++++++++>');
                // console.log(options['url']);
                // console.log(String(response.headers['content-type']));
                // console.log(body.toString().length);
                // console.log(inject_code_flag)
                // console.log('++++++++++++++++++++++++++++++++++++>\n');
                final_url = response.request.uri.href;
        
                //#================================================================RESPONSE HEADERS
                headers = response.headers;
                delete headers['content-length'];   //since we're going to manipulate the response content

                //checking if headers do not contain invalid characters (like \u0001)
                //this was included while parsing `https://www.hobbylobby.com/Home-Decor-Frames/Candles-Fragrance/Warmers-Wax-Melts/Pomegranate-Sorbet-Wickless-Fragrance-Cubes/p/80869733`
                


                //commenting below code because it stop to send header in response 200 ObjectObject
                // if(header.validHeaderName(headers) === false){
                //     headers = header.cleanHeaderName(headers);
                // }

                // if(header.validHeaderValue(headers) === false){
                //     headers = header.cleanHeaderValue(headers);
                // }

                res.writeHead(200, headers);
                //#================================================================

                var jsonArrayFromGET_Item = {
                        uri: {},
                    };
                    jsonArrayFromGET_Item['uri']['protocol']= response.request.uri.protocol;
                    jsonArrayFromGET_Item['uri']['auth']    = response.request.uri.auth;
                    jsonArrayFromGET_Item['uri']['hostname']= response.request.uri.hostname;
                    jsonArrayFromGET_Item['uri']['port']    = response.request.uri.port;
                    jsonArrayFromGET_Item['uri']['query']   = response.request.uri.query;
                    jsonArrayFromGET_Item['uri']['pathname']= response.request.uri.pathname;
                    jsonArrayFromGET_Item['uri']['path']    = response.request.uri.path;
                    jsonArrayFromGET_Item['uri']['href']    = response.request.uri.href;

                    jsonArrayFromGET_Item['REQ_headers']    = response.request.headers;
                    jsonArrayFromGET_Item['RES_headers']    = response.headers;
                
                if (String(response.headers['content-type']).indexOf('text/html') !== -1 && body.toString().length > 0 && inject_code_flag){
                    // console.log('++++++++++++++++++++++++++++++++++++>');
                    // console.log(options['url']);
                    // console.log('++++++++++++++++++++++++++++++++++++>\n');

                    var $ = cheerio.load(body);

                    //#================================================================
                    //  1.  get all the elements with `href` or `data-href` attribute OR elements with script, style tags
                    //  2.  check if they belong to IGNORE_PREFIXES category
                    //      2.a. if yes, don't modify it
                    //      2.b. if no, add the reqired prefix
                    //#================================================================

                    //#================================================================SCRIPT
                    $("script").each(function(){
                        if( $(this).attr('src') && $(this).attr('src') !== ''){
                            var value = $(this).attr('src');

                            if(!value && starts_with(value, 'javascript:')){
                                return;
                            };

                            var new_value;

                            if(starts_with(value, REL_PREFIX)){
                                new_value = new_url + 'https:'+value;
                                $(this).attr('src', new_value);
                                return ;
                            }

                            if(starts_with(value, VALID_PREFIXES)){
                                new_value = new_url + value;
                                $(this).attr('src', new_value);
                                return;
                            };
                        }
                    });

                    function starts_with(string, arr_or_prefix) {
                        if (!string) { return undefined; }

                        if (arr_or_prefix instanceof Array) {
                            for (var i = 0; i < arr_or_prefix.length; i++) {
                                if (string.indexOf(arr_or_prefix[i]) == 0) {
                                    return arr_or_prefix[i];
                                }
                            }
                        } else if (string.indexOf(arr_or_prefix) == 0) {
                            return arr_or_prefix;
                        }

                        return undefined;
                    }
                    // //#================================================================

                    // //#================================================================STYLE
                    $("style").each(function(){
                        var new_text = rewrite_style($(this).html());
                        $(this).html(new_text);
                    })

                    function rewrite_style(value)
                    {
                        var STYLE_REGEX = /(url\s*\(\s*[\\"']*)([^)'"]+)([\\"']*\s*\))/gi;

                        var IMPORT_REGEX = /(@import\s+[\\"']*)([^)'";]+)([\\"']*\s*;?)/gi;

                        function style_replacer(match, n1, n2, n3, offset, string) {
                            if(rewrite_url(n2))
                                return n1 + rewrite_url(n2) + n3;
                            else
                                return match + new_url
                        }

                        if (!value) {
                            return value;
                        }

                        if (typeof(value) === "object") {
                            value = value.toString();
                        }

                        if (typeof(value) === "string") {
                            value = value.replace(STYLE_REGEX, style_replacer);
                            value = value.replace(IMPORT_REGEX, style_replacer);
                        }

                        return value;
                    }

                    function rewrite_url(url){
                        
                        if (starts_with(url, IGNORE_PREFIXES)) {
                            return url;
                        }

                        var new_value;

                        if(starts_with(url, REL_PREFIX)){
                            new_value = new_url + 'https:'+url;
                            return new_value;
                        }

                        if(starts_with(url, VALID_PREFIXES)){
                            new_value = new_url + url;
                            return new_value;
                        };
                    }
                    //#================================================================

                    //#================================================================IFRAME
                    $("iframe").each(function(){
                        if( $(this).attr('src') && $(this).attr('src') !== ''){
                            var value = $(this).attr('src');

                            if(!value && starts_with(value, 'javascript:')){
                                return;
                            };

                            var new_value;

                            if(starts_with(value, REL_PREFIX)){
                                new_value = new_url + 'https:'+value;
                                $(this).attr('src', new_value);
                                return;
                            }

                            if(starts_with(value, VALID_PREFIXES)){
                                new_value = new_url + value;
                                $(this).attr('src', new_value);
                                return;
                            };
                        }
                    });
                    // //#================================================================

                    //#================================================================HREF
                    // $("*[href]").each(function(){
                    //     var link = $(this).attr('href');
                    //     if(!link.match(new_url)){
                    //         if(starts_with(link, IGNORE_PREFIXES)){
                    //             return ;
                    //         }

                    //         if(starts_with(link, REL_PREFIX) ){
                    //             var new_link = new_url + 'https:' + link;
                    //             $(this).attr('href', new_link);
                    //             return ;
                    //         }

                    //         if(starts_with(link, VALID_PREFIXES)){
                    //             var new_link = new_url + link;
                    //             $(this).attr('href', new_link);
                    //             return ;
                    //         }
                    //     }
                    // })
                    //#================================================================

                    //#================================================================DATA HREF
                    $("*[data-href]").each(function(){
                        var link = $(this).attr('data-href');

                        if(!link.match(new_url)){

                            if(starts_with(link, IGNORE_PREFIXES)){
                                return ;
                            }

                            if(starts_with(link, REL_PREFIX) ){
                                var new_link = new_url + 'https:' + link;
                                $(this).attr('data-href', new_link);
                                return ;
                            }

                            if(starts_with(link, VALID_PREFIXES)){
                                var new_link = new_url + link;
                                $(this).attr('data-href', new_link);
                                return ;
                            }
                        }
                    })
                    //#================================================================

                    //#================================================================OVERLAY
                    $("*[class*='overlay']").each(function(){
                        $(this).remove();
                    })
                    //#================================================================

                    //#================================================================REMOVING LINKS FROM IMG
                    $("img").each(function(){
                        if($(this).parent()[0] && $(this).parent()[0].tagName === 'a'){
                            var ele = $(this)[0];
                            var required_parent = $(this).parent().parent()[0];
                            $(this).parent().remove();
                            $(required_parent).append(ele);
                        }
                    })
                    //#================================================================

                    //#================================================================META
                    $("meta").each(function(){
                        if($(this).attr('http-equiv') && $(this).attr('http-equiv') === 'refresh'){
                            let content = $(this).attr('content');
                            let redirect_host = content.split('/')[2];
                            let redirect_protocol = '';

                            if(content.indexOf('https') > -1)
                                redirect_protocol = 'https://';
                            else
                                redirect_protocol = 'http://';

                            let redirect_config = 'false';

                            if(redirect_host){

                                connection.query("select id from config_list where user_id= ? and config_name = ?", [user_id, filename], function (err, results, fields) {
                                    //if (error) throw error
                                    redirect_config = 'false';
                                    if (err){ 
                                        console.log('==Error 11: '+err);
                                    }else{
                                        if(results.length){
                                            redirect_config= 'true';
                                        }
                                    }
                                });

                                // if (fileSystem.existsSync(path.join(__dirname, 'storage/site_config/'+redirect_host.replace(/\./g, '_')+'_'+uid+'.json'))) {
                                //     redirect_config= 'true';
                                // }else{
                                //     redirect_config = 'false';
                                // }

                                if(analyze === true){
                                    let url     = content.replace(redirect_protocol + redirect_host, 'http://' + use_ip) + '&config='+redirect_config+'&host='+redirect_host.replace(/\./g, '_')+'&analyze='+analyze;
                                    $(this).attr('content', url);
                                }else{
                                    let url     = content.replace(redirect_protocol + redirect_host, 'http://' + use_ip) + '&config='+redirect_config+'&host='+redirect_host.replace(/\./g, '_');
                                    $(this).attr('content', url);
                                }
                                
                            }
                            
                        }

                        if($(this).attr('name') && $(this).attr('name') === 'referrer'){
                            $(this).attr('content', 'no-referrer-when-downgrade')
                        }

                        if($(this).attr('http-equiv') && $(this).attr('http-equiv') === 'content-security-policy'){
                            $(this).attr('content', '_content')
                        }
                    })
                    //#================================================================

                    //#================================================================INJECT JS CODE
                    //to disable link clicking on page
                    // var scriptNode = '<script>window.setTimeout(function(){document.querySelectorAll("a").forEach((tag) => { if(tag.href)tag.addEventListener("click", e => {e.preventDefault(); e.stopPropagation()})});}, 5000);</script>' 
                    // $('body').append(scriptNode);
                    // $('body').attr('id', 'enable_right_click');
                    //#================================================================

                    //add actual url for site-config file name
                    // $('body').attr('actual_url', final_url);

                    //#================================================================INJECT CSS CODE
                    //for hover/selection border, and css for menu
                    // var customcss = '<link href="http://'+use_ip+'/css/from-the-page.css" rel="stylesheet">';
                    // $('head').append(customcss);
                    //#================================================================

                    //#================================================================INJECT HTML CODE
                    // $('body').append('<script src="http://'+use_ip+'/js/script_inject_html_code.js">');
                    //#================================================================

                    //#================================================================INJECT JS CODE
                    // var customjs = '<script src="http://'+use_ip+'/js/script.js" ></script><script src="http://'+use_ip+'/js/jquery-3.3.1.min.js" ></script><script src="http://'+use_ip+'/js/jquery-ui.min.js" ></script><script src="http://'+use_ip+'/js/bootstrap.min.js" ></script><script src="http://'+use_ip+'/config/config.js" ></script>' 
                    // $('body').append(customjs);
                    //#================================================================

                    //#================================================================INJECT ANALYZE FLAG
                    // var flagDiv = '<div id="rtech_analyze" style="display:none;">'+analyze+'</div>';
                    // $('body').append(flagDiv);
                    //#================================================================
                    // if(analyze == true){
                    //     var loaderDiv = ' <div class="loader_analyze"></div>'
                    //     $('body').append(loaderDiv);
                    // }

                    jsonArrayFromGET_Item['RES_body']   = body.toString();
                    jsonArrayFromGET_Item['method']         = response.request.method;

                    jsonArrayFromGET.push(jsonArrayFromGET_Item);

                    // console.log('=======================================>');
                    // console.log($.html());
                    // console.log('=======================================>\n');

                    //#================================================================CONFIG
                    if(config === 'true'){
                        //console.log("connection");
                        connection.query("select config from config_list where user_id= ? and config_name = ?", [uid, host], function (err, results, fields) {
                            //if (error) throw error
                            //console.log("config");
                            if (err){ 
                                console.log('==Error 12: '+err);
                            }else{
                                if(results.length){
                                    //console.log("config retrive" + results[0].config);
                                    var scriptNodeWithJson = '<script id="scriptNodeWithJson">'+results[0].config+'</script>';
                                    $('body').append(scriptNodeWithJson);
                                }
                                res.end($.html());
                            }
                        });

                        // no need to this code now we are using db to store config
                        // obj = fileSystem.readFileSync(path.join(__dirname,'storage/site_config/'+host+'_'+uid+'.json'), 'utf8');
                        // var scriptNodeWithJson = '<script id="scriptNodeWithJson">'+obj+'</script>';
                        // $('body').append(scriptNodeWithJson);
                    }else{
                        res.end($.html());
                    }
                    //#================================================================
                    
                }else {

                    if(String(response.headers['content-type']).indexOf('application/json') !== -1){
                        if (body) {
                            try{
                                jsonArrayFromGET_Item['RES_body']   = JSON.parse(body.toString());
                            }
                            catch(e){
                                jsonArrayFromGET_Item['RES_body']    = JSON.parse('{"responseContext": {}}');
                            }    
                        }
                        else{
                            jsonArrayFromGET_Item['RES_body']    = JSON.parse('{"responseContext": {}}');
                        }
                        
                        jsonArrayFromGET_Item['method']         = response.request.method;
                        jsonArrayFromGET.push(jsonArrayFromGET_Item);

                    }else{
                        jsonArrayFromGET_Item['method']         = response.request.method;

                        jsonArrayFromGET.push(jsonArrayFromGET_Item);
                    }

                    res.end(body);
                }
                
            }else{
                // res.send({status: 500, error: error.reason});
                res.send('<html class="avoid-ele"><head><style>.text-wrapper{height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;}.title-ops{font-size: 4em; color: #EE4B5E;}.title{font-size: 5em; color: #EE4B5E;}.subtitle{font-size: 40px; color: #1FA9D6;}</style></head><body class="avoid-ele"><div class="text-wrapper avoid-ele"> <div class="title-ops avoid-ele">Oops!</div><div class="title avoid-ele" data-content="404"> 404 Not Found</div><div class="subtitle"> Oops, the page you are looking for does not exist. </div></div></body></html>');

            }
        });
    }

    
    function writeLogFile(filename,logContent){     
        fileSystem.appendFile(path.join(__dirname, 'storage/log/log_'+filename+'.txt'), logContent, function (err) {
            if (err) throw err;
            //console.log('Saved!');
        });
    }


    function readLogFile(filename){             
        if(fileSystem.existsSync(path.join(__dirname, 'storage/log/log_'+filename+'.txt'))){
            var logFileContent = fileSystem.readFileSync(path.join(__dirname, 'storage/log/log_'+filename+'.txt'), 'utf8');
            return logFileContent.split('\n');      
        }else{
            return '';
        }
    }


    function writeSession(userId, writeSess){
        var session = readSession(userId);

        if (session === ''){    
            session = {};
        }       

        for (var key in writeSess) {
            if (writeSess.hasOwnProperty(key)) {           
                session[key] = writeSess[key];
                //console.log(key, writeSess[key]);

            }               
        }           
        fileSystem.writeFile(path.join(__dirname, 'storage/sess_dir/session_'+userId+'.json'), JSON.stringify(session), function (err) {
        if (err) throw err;
            //console.log('Saved!');
        });     
    }

    function readSession(userId){
        if(fileSystem.existsSync(path.join(__dirname, 'storage/sess_dir/session_'+userId+'.json'))){
            var sessContent = fileSystem.readFileSync(path.join(__dirname, 'storage/sess_dir/session_'+userId+'.json'), 'utf8');
            if(sessContent == '')
                return '';
            return JSON.parse(sessContent); 
        }else{
            return '';
        }

    }

    function isConfigExists(user_id, host_slug)
    {
        connection.query("select id from config_list where user_id= ? and config_name = ?", [user_id, host_slug], function (err, results, fields) {
            //if (error) throw error
            if (err){ 
                console.log('==Error 9: '+err);
            }else{
                if(results.length){
                    return true;
                }
            }
            return false;
        });
    }


//#================================================================POST
    //this will start the scrapping process
    app.post('/rtech/api/scrape_pages', (req, res) => {
        var body_data = req.body;
        if( 'source' in body_data ){
            var result = [], url_list_array = [];
            var query_data = [ body_data.user_id, body_data.source, 1];
            var  getInformationFromDB = function(callback) {
                connection.query("select * from tbl_url_lists Where user_id = ? and source = ? and is_active = ? and updated_at IS NULL and actual_url IS NOT NULL limit 10", query_data, function (error, results, fields){
                    if (error)  return callback(error);
                    if(results.length){
                        for(var i = 0; i < results.length; i++){
                            result.push({ 'act_url':results[i].actual_url, 'url_list_id':results[i].id, 'ref_id':results[i].ref_id});
                        }
                    }
                    callback(null, result);
                });
            };

            getInformationFromDB(function (error, result) {
                if (error) {
                    console.log("Database error!")
                    res.send({status: 500, 'config_exist':false, message: "Something went wrong" });
                }
                else if(result.length == 0){
                    res.send({status: 200, no_data:true, message: "No Data found to parse" });
                }
                else {
                    url_list_array = result;
                    if ( url_list_array.length > 0 )  {
                        var url_ = url_list_array[0].act_url;
                        var filename_ = (url_.split('/'))[2].replace(/\./g,'_');
                        var config_exist;
                        if (isConfigExists(body_data.user_id, filename_)) {
                            config_exist = true;
                            server = require('child_process').spawn('node', [path.join(__dirname, 'scraper.js'), 'databasemode', body_data.source, body_data.user_id], { shell: true });
                            res.send({status: 200, message: "Scraping start from database" });
                            //res.send({'exists': true, 'extracted_host_name': filename_})
                        }else if (fileSystem.existsSync(path.join(__dirname, 'storage/global_config/'+filename_+'.json'))) {
                            var scrapedContent = fileSystem.readFileSync(path.join(__dirname, 'storage/global_config/'+filename_+'.json'), 'utf8');
                            scrapedContent = JSON.parse(scrapedContent);
                            scrapedContent.user_id = user_id;

                            var data = {'user_id': body_data.user_id, 'config_name': filename_, 'config': JSON.stringify(scrapedContent)};
                            connection.query("INSERT INTO config_list SET ?", data, function (err, results, fields) {
                                //if (error) throw error
                                if (err) { 
                                    console.log('==Error 13: '+err);
                                    res.send({status: 200, 'config_exist':false, message: "Config not exist, Make config first", 'url':url_ });
                                }else{
                                    server = require('child_process').spawn('node', [path.join(__dirname, 'scraper.js'), 'databasemode', body_data.source, body_data.user_id], { shell: true });
                                    res.send({status: 200, message: "Scraping start from database" });
                                }
                            });

                            // fileSystem.writeFile(path.join(__dirname, 'storage/site_config/'+filename_+'_'+body_data.user_id+'.json'), JSON.stringify(scrapedContent), 'utf-8', function(err) {
                            //     if(err) {
                            //         // config_exist = false;
                            //         res.send({status: 200, 'config_exist':false, message: "Config not exist, Make config first", 'url':url_ });
                            //     }else{
                            //         // config_exist = true;
                            //         server = require('child_process').spawn('node', [path.join(__dirname, 'scraper.js'), 'databasemode', body_data.source, body_data.user_id], { shell: true });
                            //         res.send({status: 200, message: "Scraping start from database" });
                            //     }
                            // });
                        }else{
                            res.send({status: 200, 'config_exist':false, message: "Config not exist, Make config first", 'url':url_ });
                        }
                    }
                }
            });
        }
        else{
            console.log("normalmode");
            try{
                server = require('child_process').spawn('node', [path.join(__dirname, 'scraper.js'), 'normalmode', body_data.process_host_name, body_data.extracted_host_name, body_data.user_id ], { shell: true });
            }
            catch(err) {
                console.log(err.message);
            }
            var filename  = body_data.process_host_name+'_'+body_data.user_id;        
            if (debugMode === true) {
                console.log("\nScraping start for : "+body_data.extracted_host_name);            
                writeLogFile(filename, "Scraping start for : "+body_data.extracted_host_name);           
            }
            var temp = {};
            server.stdout.on('data', function (data) {
                console.log('stdout:' + data.toString());
                writeLogFile(filename, "\n"+data.toString());
            });
            server.stderr.on('error', function (code) {
                temp[body_data.process_host_name+'_success']  = false;
                temp[body_data.process_host_name+'_done']  = true;
                writeSession(body_data.user_id, temp );
                if (debugMode === true) {
                    console.log("\nScraper end but failed to parse data, error code: " + code);
                    writeLogFile(filename,"\nScraping failed");
                }
            });
            server.on('close', function (code){
                temp[body_data.process_host_name+'_success']  = true;
                temp[body_data.process_host_name+'_done']  = true;
                writeSession(body_data.user_id, temp );
                if (debugMode === true) {
                    console.log("\nScraping is done successfully, close code: " + code);             
                    writeLogFile(filename,"\nScraping is done successfully");
                }
            });
            server.on('exit', function (code, signal){
                if (debugMode === true) {
                    console.log("\nScraping exit, code: " + code);             
                    writeLogFile(filename,"\nScraper exit");
                }
            });            
            res.send({status: 200, message: "\nScraping start for : "+body_data.extracted_host_name }) 
        }
    })

    //this will receive the uploaded file of URLs
    app.post('/rtech/api/post_file', (req, res) => {        
        var data = req.body;
        var user_id  = data.user_id;
        var url_     = data.url_list[0];

        //get actual url       
        // request(options, function(error, response, body){
        //     url_ = response.request.uri.href;
        //     console.log(url_);
        // });
        console.log('pf - 1');
        url_ = getPage(data,url_,user_id,req, res);
    })

    //this will create the config file
    app.post('/rtech/api/done_config', (req, res) => {
        var filename = req.body.url;
        var user_id = req.body.user_id;
        console.log(filename);
        if(typeof req.body.data === 'string'){
            if (body) {
                try{
                    req.body.data = JSON.parse(req.body.data);
                }
                catch(e){
                    req.body.data = JSON.parse('{}');
                }    
            }
            else{
                req.body.data = JSON.parse('{}');
            }
        }

        // fileSystem.writeFile(path.join(__dirname, 'storage/site_config/'+filename+'_'+user_id+'.json'), JSON.stringify(req.body), function (err) {
        //     if (err) throw err;
        //     console.log('Saved!');
        // });

        connection.query("select id from config_list where user_id= ? and config_name = ?", [user_id, filename], function (err, results, fields) {
            //if (error) throw error
            if (err){ 
                console.log('==Error 14: '+err);
            }else{
                if(!results.length){
                    //save data to database
                    var data = {'user_id': user_id, 'config_name': filename, 'config': JSON.stringify(req.body)};
                    connection.query("INSERT INTO config_list SET ?", data, function (err, results, fields) {
                        //if (error) throw error
                        if (err) { 
                            console.log('==Error 15: '+err);
                        }else{
                            console.log("Inserted Id: " + results.insertId);
                        }
                    });
                }else{
                    var data = {'config' : JSON.stringify(req.body)};
                    var query = connection.query("update config_list SET ? where user_id=" + user_id + " and config_name='" + filename + "'", data, function (err, results, fields) {
                        //if (error) throw error
                        if (err) { 
                            console.log('==Error 16: '+err);
                        }

                    });
                }
            }
        });

        res.send({})
    })

    //this will write the scrapped data on a csv file
    app.post('/rtech/api/save_scraped_data', (req, res) => {    
        res.send({});
        return;
        //#================================================================FOR WRITING ON CSV FILE
        var filename = req.body.url+'_'+req.body.user_id;        
        //sess.filename = filename;

        var options = {includeEndRowDelimiter:true};
        console.log("trying to save data..");
        if(fileSystem.existsSync(path.join(__dirname, 'storage/site_output/'+filename+'.csv'))){
            options['headers'] = false;
            console.log("data saved");
        }else{
            options['headers'] = true;
        }
        // var csvStream = csv.createWriteStream(options),
     //        writableStream = fileSystem.createWriteStream(path.join(__dirname, 'storage/site_output/'+filename+'.csv'), {flags: 'a'});
     //    writableStream.on('finish', function(){
     //    });

        if(typeof req.body.data === 'string'){
            req.body.data = JSON.parse(req.body.data)
        }
        
        // csvStream.pipe(writableStream);
        // csvStream.write(req.body.data[0]);
        //parsedDataArray.push(req.body.data[0]);
        //console.log(parsedDataArray);
        
        var scrapedContent = [];
        if(fileSystem.existsSync(path.join(__dirname, 'storage/site_output/'+filename+'.json'))){
            scrapedContent = fileSystem.readFileSync(path.join(__dirname, 'storage/site_output/'+filename+'.json'), 'utf8');
            if(scrapedContent != ''){
             scrapedContent = JSON.parse(scrapedContent);
            }
        }
        scrapedContent.push(req.body.data[0]);

        
        var data = {'user_id': req.body.user_id, 'source': req.body.source, 'data': JSON.stringify(req.body.data[0])};
        
        if( req.body.hasOwnProperty('url_list_id')){
            data.url_list_id = req.body.url_list_id;
        }

        if( req.body.hasOwnProperty('ref_id')){
            data.ref_id = req.body.ref_id;
        }
        // var data = {'user_id': req.body.user_id, 'data': 'hello'};
        var query = connection.query("INSERT INTO scraped_data SET ?", data, function (error, results, fields) {
          if (error) throw error;
        });

        if( req.body.hasOwnProperty('url_list_id')){
            var id = req.body.url_list_id;
            var d = new Date();
            var _data = { 'updated_at': d.getFullYear() +'-'+ d.getMonth()+'-'+d.getDate() +' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds() };
            var query = connection.query("update tbl_url_lists SET ? where id="+id, _data, function (error, results, fields) {
              if (error) throw error;
            });
        }

        console.log('query :- ' + query.sql);
        console.log(req.body.data[0].url + " scrapped data saved in database");


        fileSystem.writeFile(path.join(__dirname, 'storage/site_output/'+filename+'.json'), JSON.stringify(scrapedContent), function (err) {
            if (err) throw err;
        });

        if (debugMode === true) {
            var logData = "Scraped and save data for : "+req.body.data[0].url+"\n";
            writeLogFile(filename,logData);
        }
        //console.log(req.body.data[0]);
        // csvStream.end();
        res.send({})
    })

    //this will handle all the POST requests we have redirected from the website's page to our server
    app.post('/*', (req, res) => {

        var options = {
            form: req.body,
            url: default_host + req.originalUrl,
            hostname: default_host.replace('https://', ''),            
            headers: {
                'content-type': req.headers['content-type'],
                'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36'
                //'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0'
            }
        }

        if((req.originalUrl).match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/)){
            options['url'] = req.originalUrl.replace(/^\//, '');
        }

        request.post(options, function(err,httpResponse,body){
            console.log('body - ',body);
            if(!err && httpResponse){

                var jsonArrayFromGET_Item = {
                    uri: {},
                };
                jsonArrayFromGET_Item['uri']['protocol']= httpResponse.request.uri.protocol;
                jsonArrayFromGET_Item['uri']['auth']    = httpResponse.request.uri.auth;
                jsonArrayFromGET_Item['uri']['hostname']= httpResponse.request.uri.hostname;
                jsonArrayFromGET_Item['uri']['port']    = httpResponse.request.uri.port;
                jsonArrayFromGET_Item['uri']['query']    = httpResponse.request.uri.query;
                jsonArrayFromGET_Item['uri']['pathname']= httpResponse.request.uri.pathname;
                jsonArrayFromGET_Item['uri']['path']    = httpResponse.request.uri.path;
                jsonArrayFromGET_Item['uri']['href']    = httpResponse.request.uri.href;

                jsonArrayFromGET_Item['REQ_headers']    = httpResponse.request.headers;
                jsonArrayFromGET_Item['RES_headers']    = httpResponse.headers;

                if(String(httpResponse.headers['content-type']).indexOf('application/json') !== -1 || String(httpResponse.headers['content-type']).indexOf('text/javascript') !== -1){
                    if (body) {
                        try{
                            jsonArrayFromGET_Item['RES_body']    = JSON.parse(body.toString());
                        }
                        catch(e){
                            jsonArrayFromGET_Item['RES_body']    = JSON.parse('{"responseContext": {}}');
                        }    
                    }
                    else{
                        jsonArrayFromGET_Item['RES_body']    = JSON.parse('{"responseContext": {}}');
                    }
                    
                    jsonArrayFromGET_Item['method']            = httpResponse.request.method;
                    jsonArrayFromGET.push(jsonArrayFromGET_Item);
                    
                }else{
                    jsonArrayFromGET_Item['method']            = httpResponse.request.method;

                    jsonArrayFromGET.push(jsonArrayFromGET_Item);
                }

                res.writeHead(200, httpResponse.headers);
                res.end(body);
            }else{
                res.writeHead(500);
                res.end(err);
            }
        })
    })
//#================================================================

app.listen(rtech_config.root_port, () => console.log('Example app listening on port '+rtech_config.root_port));

//#================================================================for https
// [STEPS]
// - create a folder `security` in root folder
// - set OPENSSL_CONF=C:\Users\DELL\Downloads\openssl.cnf
// - c:\Users\DELL\Downloads\bin\openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
//
// const https  = require('https');
// var privateKey  = fileSystem.readFileSync('./security/key.pem', 'utf8');
// var certificate = fileSystem.readFileSync('./security/cert.pem', 'utf8');
// var credentials = {key: privateKey, cert: certificate};
// var httpsServer = https.createServer(credentials, app);

// httpsServer.listen(8443);
//#================================================================