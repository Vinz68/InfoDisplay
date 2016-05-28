// Multiple functions in one module,
// ussing IIFE-pattern to avoid global scope polution
(function () {
    var exports = module.exports = {};
    exports.yourMethod = function (success) {

    }
    exports.yourMethod2 = function (success) {

    }


})();