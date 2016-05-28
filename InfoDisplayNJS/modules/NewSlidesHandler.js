var fs = require("fs");                     // We will use the naive file system
var chokidar = require('chokidar');			// Used to watch a folder or file.
var log4js = require('log4js'); 			// Logger module to log into files

//-----------------------------------------------------------------------------------------
// Monitors a folder for new power point slides (JPG files).
// OnFileEvent, check folder (after timeout) on new files
//              when 1 or more new JPG-files, then:
//                   copy the JPG files to a directory
//                   and generate HTML pages
//                   and generate images.json file which holds the number of HTML-pages.

var slidesDirectory = "";

function init(path) {
    slidesDirectory = path;
}

function getPath() {
    return slidesDirectory;
}

module.exports = {
    init: init,
    path: displayPath,
};






