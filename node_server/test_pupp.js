const puppeteer = require('puppeteer');

(async() => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.goto('https://www.google.com/');

  var HTML = await page.content()

  const fs = require('fs');

  var ws = fs.createWriteStream(
    'googlePage.html'
  );

  ws.write(HTML);
  ws.end();
  var ws2 = fs.createWriteStream(
    'finishedFlag'
  );
  ws2.end();
  browser.close();
})();


// function listenFor(type) {
//   return page.evaluateOnNewDocument(type => {
//     document.addEventListener(type, e => {
//       window.onCustomEvent({type, detail: e.detail});
//     });
//   }, type);
// }

// await listenFor('custom-event-ready'); // Listen for "custom-event-ready" custom event on page load.






/*const puppeteer = require('puppeteer');
 
(async () => {
	const browser = await puppeteer.launch({
	    args: [
	      '--start-maximized',
	    ],
	    headless: false,
	  }
	);

	const page = await browser.newPage();
       
	await page.setViewport({
		width: 1370,
		height: 800,
	});
	await page.goto('https://www.rediff.com');
	
	await page.screenshot({path: 'example.png'});

	//await page.pdf({path: 'test.pdf', format: 'A4'});

	await browser.close();
}) ();*/