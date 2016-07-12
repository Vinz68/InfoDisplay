// --------------------------------------------------------------------------------------------------
// newSlidesHandler - NodeJS implementation 
//
// Monitors a "slidesDirectory" for new power point slides (JPG files).
// On Add FileEvent (=new file detected)
//                   copy the JPG files to a "imageDirectory"
//                   and generate HTML pages
//                   and generate slides.json file which holds the number of HTML-pages.
// 2016-05-30 Vincent van Beek
//-----------------------------------------------------------------------------------------------------

var fs = require('fs');                     // We will use the native file system
var chokidar = require('chokidar');			// Used to watch a folder or file; see https://github.com/paulmillr/chokidar
var log4js = require('log4js'); 			// Logger module, used to log into files
var path = require('path');                 // Directory and file operations 
var config = require('./newSlidesHandler.json');      // The (persitent) information of the slides (html pages) 

//var child_process = require("child_process");   // Used to execute native shell commands.
//var hostnameFQDN;

// TODO: set this in a newSlidesHandler.json config file
//var slidesDirectory = '/var/powerpoint_samba/*.JPG';
//var imageDirectory = '/home/pi/InfoDisplay/html/images/';
//var htmlDirectory = '/home/pi/InfoDisplay/html/';

var slidesFile = "./modules/slides.json";   // The (persitent) information of the slides (html pages) in JSON format.
var slidesObj;                              // Javascript object, which holds the JSON slidesFile
var newSlidesArray = [];                    // Array with new (incomming) slides (JPG images)
var processingNewSlides = false;            // Flag which indicates that we are busy processing a new (batch) of slides.

var timerId = 0;                            // delay timer id
var timerDelay = 10000;                     // xx seconds delay to process new incoming files from the samba share.


//------------------------------------------------------------------------------------------------------
// Setup logging
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/infoDisplay.log'), 'NewSlidesHandler');
var logger = log4js.getLogger('NewSlidesHandler');

// Log that w're starting
logger.info('Starting NewSlidesHandler...');
//------------------------------------------------------------------------------------------------------


function init() {

    var dirname = path.dirname(config.slidesDirectory);

    try {
        logger.info('init: Starting...');

        // Check that slidesDirectory (path) exists
        fs.accessSync(dirname, fs.F_OK);
        logger.info('init: SlidesDirectory: ' + dirname + ' is accessable');

        // read the last generated file which hold the current set of Slides (html pages with powerpoint JPG images).
        logger.info( 'init: Read and parse JSON file: ' + slidesFile + ' ....');
        slidesObj = JSON.parse(fs.readFileSync(slidesFile, 'utf8'));

        // Set a file watcher on the "slidesDirectory"
        watchForNewSlides(config.slidesDirectory);

        logger.info('init: Completed succesfully.');

    } catch (e) {
        // It isn't accessible
        logger.error('init: SlidesDirectory: ' + dirname + ' is NOT accessable');
        logger.error('init: Error: ' + e);
    }
}


function getSlides() {
    return slidesObj
}


function getPath() {
    return config.slidesDirectory;
}



//-----------------------------------------------
// Private Module Functions - used internally only
//------------------------------------------------

// Setup a file/directory watcher
function watchForNewSlides(fullPathName) {
 
    // Initialize watcher.
    var watcher = chokidar.watch(fullPathName, {
        ignored: /[\/\\]\./,
        persistent: true
    });

    logger.info("FileWatcher set on directory: " + fullPathName);

    // Add event listeners. => trigger function when new files are added in the watched path.
    watcher
      .on('add', path => fileAdded(path))
      .on('change', path => logger.info(`File ${path} has been changed`))
      .on('unlink', path => logger.info(`File ${path} has been removed`))
      .on('ready', () => logger.info('Initial scan complete. Ready for changes'));
}


function fileAdded(fileName)
{
    // Use case/scenario that a batch of new files will be added within a certain time
    // After this time the JPG files will be moved to a "images" directory and a HTML files will be generated (in the "html" directory) for each JPG file.
    // (The generated HTML pages are able to view the JPG image full-screen in a full-screen web-browser)

    // if (processingNewSlides) return;  // do not continue when we are processing a batch of files

    // Push file into an array (to be processed later when we know how many files in total we have to process..)
    newSlidesArray.push(fileName);

    logger.info('File ' + fileName + ' has been added to the internal array (to be processed later..)');

    //logger.info('#Queued files to process: ' + newSlidesArray.length);

    if (timerId == 0) {
        // Timer currently not in use / set time out to process the JPG files later...
        timerId = setTimeout(processNewSlides, timerDelay);
    }
    else {
        // Timer was already running;  restart the timer.
        clearTimeout(timerId);
        timerId = setTimeout(processNewSlides, timerDelay);
    }
}



function processNewSlides() {

    logger.info('ProcessNewSlides: ' + newSlidesArray.length);

    try {
        
        processingNewSlides = true;

        if (newSlidesArray.length > 0) {
            // Sort the array (on file name) and generate for each JPG file a HTML page
            newSlidesArray.sort();
            newSlidesArray.forEach(generateHtmlFile);

            // Create new JSON file which hold the slides (html pages).
            // Needs a delay to complete generation of the HTML files.
            setTimeout(updateSlidesJson, timerDelay);
        }
    }
    catch (e) {

        logger.error("Something went wrong during processNewSlides. Error = " + e);

        // allow new batch to process JPG files.
        processingNewSlides = false;
    }

}


function generateHtmlFile(element, index, array) {

    var fileName = element;

    // Move the file from the Samba Share to the "html/images" folder.
    move(fileName, config.imageDirectory + path.basename(fileName), function (err) {

        // If an error occurred, handle it (throw, propagate, etc)
        if (err) {
            logger.error('processNewSlide:  Move Failed. Error = ' + err);
            return;
        }
        // Otherwise, the file should be moved
        logger.info('file: ' + fileName + 'is moved to: ' + config.imageDirectory + path.basename(fileName));

        // Create one html file for each slide (JPG image)
        generateHtmlPage(path.basename(fileName), index);
    });

}

function updateSlidesJson() {

    try {

        logger.info("Update slides.json file....");

        // delete all "pages" rows from the slides.json (in memory) structure.
        logger.info("Delete all slide-pages from slides.JSON structure....");
        slidesObj.pages.splice(0, slidesObj.pages.length );


        // Get current time stamp, and add update the JSON structure
        logger.info("Updating timestamp attribute in JSON stucture....");
        slidesObj.timestamp = new Date().toLocaleString();

        // ForEach file in the array (newSlidesObj)
        logger.info("Add pages in JSON stucture....");

        for (var x = 0; x < newSlidesArray.length; x++) {
            // Create a page attributes and store in JSON format on disk.
            /*
                "title": "Cerner Information - Slide0",
                "type": "webpage",
                "interval": 7500,
                "url": "http://powerpointpi/Slide0.JPG.html"
            */

            slidesObj['pages'].push({
                "title": "Cerner Info - " + path.basename(newSlidesArray[x], '.JPG'),
                "type": "webpage",
                "interval": 7500,
                "url": "http://"+ config.hostnameFQDN + "/" + path.basename(newSlidesArray[x]) + ".html"
            });
        }

        // Show new JSON structure in Log file
        // TODO: Sort the array ??   => Slide0---Slidex (since processing files will not be alphabetic)
        logger.info('/slides =>' + JSON.stringify(slidesObj, null, 4));

        // Save JSON (slidesObj) to disk (slides.json)
        fs.writeFile(slidesFile, JSON.stringify(slidesObj, null, 4), function (err) {
            if (err) {
                logger.error("Save slidesObj to disk (slides.json) has failed");
                throw err;
            }
            logger.info("Save slideObj to disk (slides.json) has been succeeded.");
        });

    }
    catch (e) {
        logger.error("Something went wrong during updating or saving the slides.json file. Error= " + e);
    }
    finally {

        // unblock processing
        processingNewSlides = false;
    }

}


function move(oldPath, newPath, callback) {
    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            } else {
                callback(err);
            }
            return;
        }
        callback();
    });

    function copy() {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);
        readStream.on('close', function () {

            fs.unlink(oldPath, callback);
        });

        readStream.pipe(writeStream);
    }
}

function generateHtmlPage(JPGFileName, index) {

    fs.readFile(config.htmlDirectory+'/slide_template.html', 'utf8', function (err, data) {
        if (err) {
            return logger.error(err);
        }

        var replaceByFileName = './images/' + JPGFileName;
        var replaceByFileDescription = 'Cerner Info-Slide-' + index;

        logger.info("Generate HTML page will embed slide#:" + index + " JPG:" + replaceByFileName);

        var result = data.replace(/@@IMAGE-FILE-NAME@@/g, replaceByFileName);
        result = result.replace(/@@IMAGE-FILE-DESCRIPTION@@/g, replaceByFileDescription);
        
        fs.writeFile(config.htmlDirectory + JPGFileName+ '.html', result, 'utf8', function (err) {
            if (err) {
                return logger.error(err);
            }

            logger.info('HTML page generated:' + config.htmlDirectory + JPGFileName + '.html');
        });
    });
}



module.exports = {
    init: init,
    displayPath: getPath,
    getSlides: getSlides,
};


