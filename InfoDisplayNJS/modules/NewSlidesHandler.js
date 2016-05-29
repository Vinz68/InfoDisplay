// --------------------------------------------------------------------------------------------------
// newSlidesHandler - NodeJS implementation 
//
// Monitors a "slidesDirectory" for new power point slides (JPG files).
// On Add FileEvent (=new file detected)
//                   copy the JPG files to a "imageDirectory"
//                   and generate HTML pages
//        TODO===>   and generate images.json file which holds the number of HTML-pages.
// 2016-05-30 Vincent van Beek
//-----------------------------------------------------------------------------------------------------

var fs = require('fs');                     // We will use the naive file system
var chokidar = require('chokidar');			// Used to watch a folder or file; see https://github.com/paulmillr/chokidar
var log4js = require('log4js'); 			// Logger module to log into files
var path = require('path');


// TODO: set this in a newSlidesHandler.json config file
var slidesDirectory = '/var/powerpoint_samba/*.JPG';
var imageDirectory = '/home/pi/InfoDisplay/html/images/';
var htmlDirectory = '/home/pi/InfoDisplay/html/';


//------------------------------------------------------------------------------------------------------
// Setup logging
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/infoDisplay.log'), 'NewSlidesHandler');
var logger = log4js.getLogger('NewSlidesHandler');

// Log that w're starting
logger.info('Starting NewSlidesHandler...');


var log = console.log.bind(console);

function init() {

    var dirname = path.dirname(slidesDirectory);

    // Check that slidesDirectory (path) exists
    try {
        fs.accessSync(dirname, fs.F_OK);
        logger.info(__filename + '-Init Directory: ' + dirname + ' is accessable');

        watchForNewSlides();

        logger.info(__filename + '-Init Slides Handler initiated on directory: ' + slidesDirectory);


    } catch (e) {
        // It isn't accessible
        logger.info(__filename + '-Init Directory: ' + dirname + ' is NOT accessable');
        logger.error(__filename + ' Error: ' + e);
    }
}


function getPath() {
    return slidesDirectory;
}



//-----------------------------------------------
// Functions used internally only
//------------------------------------------------
function watchForNewSlides() {
 
    // Initialize watcher.
    var watcher = chokidar.watch(slidesDirectory, {
        ignored: /[\/\\]\./,
        persistent: true
    });


    logger.info("watchForNewSlides watch on directory: " + slidesDirectory);


    // Add event listeners.
    watcher
      .on('add', path => processNewSlide(path))
      .on('change', path => logger.info(`File ${path} has been changed`))
      .on('unlink', path => logger.info(`File ${path} has been removed`))
      .on('ready', () => logger.info('Initial scan complete. Ready for changes'));
}

function processNewSlide(fileName)
{
    logger.info('File ' + fileName + ' has been added');

    move(fileName, imageDirectory + path.basename(fileName), function (err) {
        // If an error occurred, handle it (throw, propagate, etc)
        if (err) {
            logger.error('processNewSlide  Move Failed. Error = ' + err);
            return;
        }
        // Otherwise, the file should be moved
        logger.info('file: ' + fileName + 'is moved to: ' + imageDirectory + path.basename(fileName));

        // Create html file
        generateHtmlPage(path.basename(fileName));

    });
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
};






