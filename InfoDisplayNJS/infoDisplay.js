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
var express = require('express');           // Node.js web application framework
var fs = require('fs');                     // We will use the native file system
var chokidar = require('chokidar');			// Used to watch a folder or file.
var log4js = require('log4js'); 			// Logger module to log into files

var config = require('./config.json');      // The configuration of this module.

var app = express();                        // W're using Express
var port = 8081;                            // Node will listen on port number...
var imagesList = [];                        // Array with slide images (JPGs)
var pagesList = [];	                        // Array with slide (web) pages (URLs and settings)


var slidesHandler = require('./modules/newSlidesHandler.js');    // Monitors share on new PPT-slides (JPGs) and create a html page for each slide



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

// Monitors a directory on JPG images and generates HTML pages showing the JPG full screen.
// ==> To-Do, setup callback in handler (when new HTML pages are generated)
slidesHandler.init();
//logger.info("Slides Handler initiated on directory: " + slidesHandler.displayPath());



logger.info('Config numberOfImages=' + config.numberOfImages);

//-------------------------------------------------------------------------------------------------------
// Build list of slide images (JPG files)
logger.info('List of images (JPGs):');
var imageId, sourceId;
for (var i=0; i<config.numberOfImages; i++){
    imageId = 'image' + i;
	sourceId = config.src + config.filePrefix + i + config.filePostfix;
	imagesList.push({ id: imageId, src: sourceId });
}
logger.info('--->' + JSON.stringify(imagesList));


//-------------------------------------------------------------------------------------------------------
// Load list of (web) pages and its settings (JPG files)
logger.info('List of pages (URLs and settings):');
pagesList = JSON.parse(fs.readFileSync('./pages.json', 'utf8'));
logger.info('--->' + JSON.stringify(pagesList));

	
 //--------------------------------------------------------------------------------------------------------
// File watch on the config file
var watcher = chokidar.watch('./config.json', {
  ignored: /[\/\\]\./, persistent: true
});

watcher
  .on('add', function(path) { logger.debug('File', path, 'has been added'); })
  .on('change', function(path) { logger.debug('File', path, 'has been changed'); })
  .on('unlink', function(path) { logger.debug('File', path, 'has been removed'); })
  .on('error', function(error) { logger.debug('Error happened', error); })
  .on('ready', function() { logger.debug('Initial scan complete. Ready for changes.'); })
  .on('raw', function(event, path, details) { logger.debug('Raw event info:', event, path, details); })

// 'add', 'addDir' and 'change' events also receive stat() results as second
// argument when available: http://nodejs.org/api/fs.html#fs_class_fs_stats
watcher.on('change', function(path, stats) {
  if (stats) logger.debug('File', path, 'changed size to', stats.size);
});


app.use(function (req, res, next) {
    // CORS: Allow cross-domain requests (blocked by default) 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get('/images', function (req, res, next) {
	// Send the list of slide images (JPG files) on request.
	
	logger.info('get-images requested. returning the array with IDs and SRCs');
	res.contentType('application/json');
	res.send(JSON.stringify(imagesList, null, 4));
});


app.get('/pages', function (req, res, next) {
    // Send the list of web pages (URLs) on request.

    logger.info('get-pages requested. returning the array with urls and settings');
    res.contentType('application/json');
    res.send(JSON.stringify(pagesList, null, 4));
});


var server = app.listen(port, function () {
    // Setup the server / start listening on configured IP & Port.

    var host = server.address().address;
  logger.info("InfoDisplay app listening at http://%s:%s", host, server.address().port);
});














