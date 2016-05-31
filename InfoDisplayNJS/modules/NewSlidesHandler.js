// --------------------------------------------------------------------------------------------------
// newSlidesHandler - NodeJS implementation 
//
// Monitors a "slidesDirectory" for new power point slides (JPG files).
// On Add FileEvent (=new file detected)
//                   copy the JPG files to a "imageDirectory"
//                   and generate HTML pages
//        TODO===>   and generate slides.json file which holds the number of HTML-pages.
// 2016-05-30 Vincent van Beek
//-----------------------------------------------------------------------------------------------------

var fs = require('fs');                     // We will use the native file system
var chokidar = require('chokidar');			// Used to watch a folder or file; see https://github.com/paulmillr/chokidar
var log4js = require('log4js'); 			// Logger module, used to log into files
var path = require('path');                 // Directory and file operations 
//var slides = require('./modules/slides.json');      // The (persitent) information of the slides (html pages) 


// TODO: set this in a newSlidesHandler.json config file
var slidesDirectory = '/var/powerpoint_samba/*.JPG';
var imageDirectory = '/home/pi/InfoDisplay/html/images/';
var htmlDirectory = '/home/pi/InfoDisplay/html/';

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

    var dirname = path.dirname(slidesDirectory);

    try {
        // Check that slidesDirectory (path) exists
        fs.accessSync(dirname, fs.F_OK);
        logger.info(__filename + '-init SlidesDirectory: ' + dirname + ' is accessable');

        // read the last generated file which hold the current set of Slides (html pages with powerpoint JPG images).
        logger.info(__filename + '-init Read and parse JSON file: ' + slidesFile + ' ....');
        slidesObj = JSON.parse(fs.readFileSync(slidesFile, 'utf8'));

        // Set a file watcher on the "slidesDirectory"
        watchForNewSlides(slidesDirectory);

    } catch (e) {
        // It isn't accessible
        logger.error(__filename + '-init SlidesDirectory: ' + dirname + ' is NOT accessable');
        logger.error(__filename + ' Error: ' + e);
    }
}


function getSlides() {
    return slidesObj
}


function getPath() {
    return slidesDirectory;
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
    move(fileName, imageDirectory + path.basename(fileName), function (err) {

        // If an error occurred, handle it (throw, propagate, etc)
        if (err) {
            logger.error('processNewSlide:  Move Failed. Error = ' + err);
            return;
        }
        // Otherwise, the file should be moved
        logger.info('file: ' + fileName + 'is moved to: ' + imageDirectory + path.basename(fileName));

        // Create one html file for each slide (JPG image)
        generateHtmlPage(path.basename(fileName));
    });

}

function updateSlidesJson() {

    try {

        logger.info("Update slides.json file....");

        // TODO:

        // delete or empty the ./slides.json file (or use the slidesObj to do this)
        logger.info("Deleting pages from JSON structure....");
        delete slidesObj.pages;

        // Get current time stamp, and add to JSON file
        logger.info("Updating timestamp attribute in JSON stucture....");

        var currentTime = new Date().getTime();
        slidesObj.timestamp = currentTime;

        // ForEach file in the array (newSlidesObj)
        logger.info("Add pages in JSON stucture....");

        // ====> TODO: First aad slidesObj.pages ? (or not delete slidesObj.pages; but delete sldesObj.pages[0 to length-1]

        for (var x = 0; x < newSlidesArray.length; x++) {
            // Create a page attributes and store in JSON format on disk.
            /*
                "title": "Cerner Information - Slide0",
                "type": "webpage",
                "interval": 5000,
                "url": "http://powerpointpi/Slide0.JPG.html"
            */

            slidesObj['pages'].push({
                "title": "Cerner Info - Slide" + x,
                "type": "webpage",
                "interval": 5000,
                "url": "http://powerpointpi/" + path.basename(newSlidesArray[x]) + ".JPG.html"
            });
        }

        // TODO: Save  slidesObj to disk (slides.json)
        logger.info("TODO: Save  slidesObj to disk (slides.json)....");

    }
    catch (e) {
        logger.error("Something went wrong during saving the slides.json file. Error= " + e);
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

function generateHtmlPage(JPGFileName) {

    fs.readFile(htmlDirectory+'/slide_template.html', 'utf8', function (err, data) {
        if (err) {
            return logger.error(err);
        }

        var replaceBy = './images/'+JPGFileName;
        var result = data.replace(/@@IMAGE-FILE-NAME@@/g, replaceBy);
        
        fs.writeFile(htmlDirectory + JPGFileName+ '.html', result, 'utf8', function (err) {
            if (err) {
                return logger.error(err);
            }

            logger.info('HTML page generated:' + htmlDirectory + JPGFileName + '.html');
        });
    });
}



module.exports = {
    init: init,
    displayPath: getPath,
    getSlides: getSlides,
};






