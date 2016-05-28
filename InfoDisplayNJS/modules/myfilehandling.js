// myfilehandling.js

var myfilehandling = function () { };

MyFileHandmyfilehandlingling.prototype.copyFile = function (source, target) {
    return new Promise(function (resolve, reject) {
        var rd = fs.createReadStream(source);
        rd.on('error', reject);
        var wr = fs.createWriteStream(target);
        wr.on('error', reject);
        wr.on('finish', resolve);
        rd.pipe(wr);
    });
}

//--------------------------------------------------------------------------------------------------------
// File watch on the config file
var watcher = chokidar.watch('/temp/*.JPG', {
    ignored: /[\/\\]\./, persistent: true
});

watcher
  .on('add', function (path) { logger.debug('File', path, 'has been added'); })
  .on('change', function (path) { logger.debug('File', path, 'has been changed'); })
  .on('unlink', function (path) { logger.debug('File', path, 'has been removed'); })
  .on('error', function (error) { logger.debug('Error happened', error); })
  .on('ready', function () { logger.debug('Initial scan complete. Ready for changes.'); })
  .on('raw', function (event, path, details) { logger.debug('Raw event info:', event, path, details); })

// 'add', 'addDir' and 'change' events also receive stat() results as second
// argument when available: http://nodejs.org/api/fs.html#fs_class_fs_stats
watcher.on('change', function (path, stats) {
    if (stats) logger.debug('File', path, 'changed size to', stats.size);
});

module.exports = new myfilehandling();