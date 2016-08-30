// --------------------------------------------------------------------------------------------------
// InfoDisplay - NodeJS implementation 
// - WebApi 
//     - /images => array of images (JPG files). Clients browsers can show these (in a slideshow)
//     - /pages => array of web-pages. Client can visit & show them (in a slideshow)
//      
// This WebAPI is created for the viewer InfoDisplayFE - HTML5/AngularJS implementation of a picture/webpage slide show
// 
// 2016-05-29 Vincent van Beek
//-----------------------------------------------------------------------------------------------------
var express = require('express');           // Express web application framework. http://expressjs.com/ 
var fs = require('fs');                     // We will use the native file system
var os = require('os');                     // OS specific info
var config = require('./infoDisplayConfig.json'); 	// Configuration file of this module which includes Logger configuration (log4js)

var app = express();                        // W're using Express
var port = 80;                              // Node will listen on port number...
var hostname = 'localhost';                 // our hostname

var pagesList = [];	                        // Array with pages (URLs and settings) to be shown by the client browser in a slide show.


//------------------------------------------------------------------------------------------------------
// Setup & Configure logging; from config.file
var log4js = require('log4js'); 			// Logger module to log into files
log4js.configure(config.log4js);
var logger = log4js.getLogger("infoDisplay");

// see: https://github.com/nomiddlename/log4js-example/blob/master/app.js

// Log that w're starting
logger.info('Starting InfoDisplay...');


//------------------------------------------------------------------------------------------------------
// Monitors a local samba share on new PPT-slides (JPGs) and create a html page for each slide
var slidesHandler = require('./modules/slides/newSlidesHandler.js');   //  Monitors a local samba share on new PPT-slides (JPGs) and create a html page for each slide
slidesHandler.init();

//-------------------------------------------------------------------------------------------------------
// Initialize news handler
var newsHandler = require('./modules/news/newsHandler.js');
newsHandler.init();


// Show in logfile what to expect on a app.get- /slides 
logger.debug('/slides =>' + JSON.stringify(slidesHandler.getSlides(), null, 4));


//-------------------------------------------------------------------------------------------------------
// Load list of configured web-pages and its settings.
logger.debug('Load configured pages (pages.json)');
pagesList = JSON.parse(fs.readFileSync('./pages.json', 'utf8'));
logger.debug('/pages =>' + JSON.stringify(pagesList, null, 4));


//--------------------------------------------------------------------------------------------------------

// static link the "www-root" folder
app.use('/', express.static('html'));
logger.info('Mapped html subfolder to http://'+ os.hostname() );

app.use(function (req, res, next) {
    // CORS: Allow cross-domain requests (blocked by default) 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get('/slides', function (req, res, next) {
    // Send the list of slides (web pages /URLs) on request.

    logger.info('get-slides requested. returning the array with urls and settings');

    res.contentType('application/json');
    res.send(JSON.stringify(slidesHandler.getSlides(), null, 4));
});


app.get('/pages', function (req, res, next) {
    // Send the list of web pages (URLs) on request.

    logger.info('get-pages requested. returning the array with urls and settings');
    res.contentType('application/json');
    res.send(JSON.stringify(pagesList, null, 4));
});


app.get('/news',function(req,res){
	try{
		logger.info('NEWS start: ');
		var html = newsHandler.getIndexHTML();
		
		if (html) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(html);
			res.end();
		} else {
			res.status(503, 'Unable to retrieve index').end();
		}
	} catch (err) {
		logger.error('/news/ : Something went wrong....' , err);
		res.status(503, 'Something went wrong: ' + err).end();
	}
});


app.get('/news/:source/items', function(req, res) {
	try {
		var source = req.params.source;
		logger.info('app.get: /news/' + source + '/items');
		
		var items = newsHandler.getNewsItems(source);
		if (items) {
			res.json(items);
			res.end();  
		} else {
			res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
			res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
			res.setHeader("Expires", "0"); // Proxies.
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write("<html><body><p>News items not (yet?) loaded for source: " + source + "</p></body></html>");
			res.end();  
		}
	} catch (err) {
		logger.error('/news/:source/items : Something went wrong....' , err);
		res.status(503, 'Something went wrong: ' + err).end();		
	}
});


app.get('/news/:source', function(req, res) {
	try {
		var source = req.params.source;
		logger.info('app.get: /news/' + source);
		
		var html = newsHandler.getNews(source);
		if (html) {
			res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
			res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
			res.setHeader("Expires", "0"); // Proxies.
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(html);
			res.end();  
		} else {
			res.status(404, 'News source not found or not yet cached (' + source + ')').end();
		}
	} catch (err) {
		logger.error('/news/:source : Something went wrong....' , err);
		res.status(503, 'Something went wrong: ' + err).end();		
	}
}); 


var server = app.listen(port, function () {
    // Setup the server / start listening on configured IP & Port.

    logger.info('InfoDisplay app listening on port:' + server.address().port);
});


