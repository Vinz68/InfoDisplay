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
var log4js = require('log4js'); 			// Logger module to log into files

var config = require('./config.json');      // The configuration of this module.

var slidesHandler = require('./modules/newSlidesHandler.js');   //  Monitors a local samba share on new PPT-slides (JPGs) and create a html page for each slide

var app = express();                        // W're using Express
var port = 80;                              // Node will listen on port number...
var hostname = 'localhost';                 // our hostname

var pagesList = [];	                        // Array with pages (URLs and settings) to be shown by the client browser in a slide show.



//------------------------------------------------------------------------------------------------------
// Setup logging
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/infoDisplay.log'), 'InfoDisplay');
var logger = log4js.getLogger('InfoDisplay');
// logger.setLevel('ERROR');   // All log items of level ERROR and higher will be saved in the file

// future do: log4js.configure('my_log4js_configuration.json', { reloadSecs: 300 });
// see: https://github.com/nomiddlename/log4js-example/blob/master/app.js

// Log that w're starting
logger.info('Starting InfoDisplay...');


//------------------------------------------------------------------------------------------------------
// Monitors a local samba share on new PPT-slides (JPGs) and create a html page for each slide
slidesHandler.init();

// Show in logfile what to expect on a app.get- /slides 
logger.info('/slides =>' + JSON.stringify(slidesHandler.getSlides(), null, 4));


//-------------------------------------------------------------------------------------------------------
// Load list of configured web-pages and its settings.
logger.info('Load configured pages (pages.json)');
pagesList = JSON.parse(fs.readFileSync('./pages.json', 'utf8'));
logger.info('/pages =>' + JSON.stringify(pagesList, null, 4));


//--------------------------------------------------------------------------------------------------------

// static link the "www-root" folder to http://hostname/info
app.use('/', express.static('html'));
logger.info('Mapped html subfolder to http://[hostname]');

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


var server = app.listen(port, function () {
    // Setup the server / start listening on configured IP & Port.

    logger.info('InfoDisplay app listening at http://' + server.address().address + ":" + server.address().port);
});

















