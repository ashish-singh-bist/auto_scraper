const puppeteer = require('puppeteer');
const path      = require('path');
const fileSystem= require('fs');
const mysql     = require('mysql')
const config    = require(path.join(__dirname, 'config/config.js'));

var windowOpenWith  = 'http://' + config.root_ip + ':' + config.root_port ;
var parsing_mode  = process.argv[2];

var url_list_array = [];

if ( parsing_mode == 'databasemode') {
    var source =  process.argv[3];
    user_id = process.argv[4];

    var data = [user_id, source, 1];
    var result = [];

    var host_base_url = '';       //'https://www.youtube.com';
    var host_slug = '';         //'www_youtube_com'

    var  getInformationFromDB = function() {
        const connection    = mysql.createConnection({
                                  host     : config.mysql_host,
                                  user     : config.mysql_user,
                                  password : config.mysql_password,
                                  database : config.mysql_database
                              });
        //connect to database
        connection.connect();
        console.log("Scraper: Database connected");

        //execute query to select url to parse
        connection.query("select * from tbl_url_lists Where user_id = ? and source = ? and is_active = ? and updated_at IS NULL and actual_url IS NOT NULL limit 10", data, function (error, results, fields){
            if (error)  return callback(error);
            if(results.length){
                for(var i = 0; i < results.length; i++){
                    result.push({ 'act_url':results[i].actual_url, 'url_list_id':results[i].id, 'ref_id':results[i].ref_id, 'source':results[i].source});
                }
            }
            callback(null, result);
        });
        connection.end();
        run();
    };

    getInformationFromDB(function (error, result) {
        if (error) console.log("Database error!");
        else {
            url_list_array = result;
            if ( url_list_array.length > 0 )  {
                var url_ = url_list_array[0].act_url;
                host_slug = (url_.split('/'))[2].replace(/\./g,'_');

                var split_ar = url_.split('/');
                host_base_url = split_ar[0] + '//' + split_ar[2];
            }
            run();
        }
    });
}
else{
    var host_slug   = process.argv[3];      //slug of host_base_url
    var host_base_url = process.argv[4];    //base url of website
    user_id = process.argv[5];              //user id of login user     

    //read url list to parse, which user uploaded recently
    var url_arr_ = (fileSystem.readFileSync(path.join(__dirname, 'storage/product_url/'+host_slug+'_'+user_id+'_url_list_.txt'), 'utf8')).split('\r\n');
    for(var i = 0; i < url_arr_.length; i++){
        url_list_array.push({ 'act_url':url_arr_[i] });
    }
    run();
}

/*_________________________Scraping with headless browser____________________________________*/
async function run() 
{
    (async () => {
        try {
        
            const pages = url_list_array.map(async (url_obj, i) => {

                //create url to process
                let temp_url = windowOpenWith+url_obj.act_url.replace(host_base_url, '').replace(/\;/g,'');
                var url = temp_url+'&config=true&host='+host_slug+'&uid='+user_id ;

                //add some more parameter in url
                if ( parsing_mode == 'databasemode')
                    url += '&url_list_id='+url_obj.url_list_id+'&ref_id='+url_obj.ref_id+'&source='+url_obj.source;

                const browser = await puppeteer.launch();
                //const browser = await puppeteer.launch({headless: false}); //for RTech* (if you want to view the scraping on browser)
                //const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}); // for ovh

                const page = await browser.newPage();

                console.log(`loading page: ${url}`);
                await page.goto(url, {
                    waitUntil: 'networkidle0',
                    timeout: 120000,
                });

                //save html as pdf format for testing purpose
                // console.log(`saving as pdf: ${url}`);
                // await page.pdf({
                //   path: `${i}.pdf`,
                //   format: 'Letter',
                //   printBackground: true,
                // });

                console.log(`closing page: ${url}`);
                //await page.waitFor(5000); //wait if necessary
                console.log(`page closed`);
                await page.close();
                await browser.close();
            });

            await Promise.all(pages).then(() => {
              //do anything which you want to execute at the end
              //parsing done
            });
        } catch (error) {
            //console error if any
            console.log(error);
        }
    })();
 }