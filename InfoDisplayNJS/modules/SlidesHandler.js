// Multiple functions in one module,

var createSlidesHandler = function () {
    var slidesPath = path;
    var workCount = 0;

    var init = function (path) {
        workCount += 1;
        conslode.log("init done for path: " + path);
    }

    var newFiles = function () {
        workCount += 1;
        conslode.log("newFiles " + workCount);
        return false;
    }

    return {
        job1: init,
        job2: newFiles
    };
};

module.export(createSlidesHandler);

