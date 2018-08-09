### PART 1: index.php [root folder] 

1) the first page of this application which is served.
	- There's a `Click to upload file` input tag, through which you can select the file containing URLs [on which you'll be performing further actions].
	- After you select a file, if the input box turns `green` in color, it means you're good to go ahead, and a submit button will be displayed.
	- After you select a file, if the input box turns `red` in color, it means there's some problem at the server end or the network, and the displayed submit button will be disabled.
	- There's a checkbox also below the input box, which provides you the option of `analyzing page's Network`.

2)  The submit button sends the selection [of form] as arguments to a script `client.js` for further processing .The following functionalities are provided at `index.php`
	- If a config file of the website [whose URLs you are providing through the file] has already been made, it starts scraping the URLs
	- If a config file has not been made, it picks the first URL from the list and opens only that, so config can be made and saved.
	- If the checkbox is selected, it opens the first URL from the list for network traffic analysis i.e. displays the flow of network for that page.

### PART 2: client.js [root folder]

1) This script will receive the arguments from `index.php`, process them, re write the URL(s) to be openened with some extra query parameters, and accordingly make system calls to open the resultant URL(s) on browser.

2) eg if our URL is `https://www.gnc.com/all-total-lean/CLA.html`, it will convert it as
	`http://localhost:3002/all-total-lean/CLA.html?config=false^&host=www_gnc_com^&analyze=true` [assuming config has not ben made for this website and user has opted for network analysis]

3) This script can also be run independitely [from system console] by sending the required parameteres, in the format
	`node client.js <some_url> [optional parameter for analysis: 'on']`

	eg `node client.js https://www.gnc.com/all-total-lean/CLA.html on` will open the page for analysis
	   `node client.js https://www.gnc.com/all-total-lean/CLA.html` will open the page for config making/ scrapping.

### PART 3: server.js [root folder]

1) This file is the server end of the application, which catches all the requests being made from the webpage of URL we opened. It re writes the URLs present on the page document so that they pass through our server before being sent to the actual website server. It can be started from system console using command `node server.js` and stopped using `Ctrl + C`

### PART 4: script.js [js folder]

1) Present inside the `js` folder, this file is injected in the original webpage's document by `server.js`. It contains the code for scraping part, both for selecting elemnts while creating config, and for autoscraping information based on an already available config.

### PART 5: config.js [config folder]

1) consists of config information eg. the ip which'll be used acros application.

#### PART 6: analyze.html [root folder]

1) This is the page which'll display the request-response information of the URL provided.