var
    imagesList = [];                                // Array with slide images (JPGs)
    slideNr = 0;                                    // Currently shown slide number
    timerNextSlide = null;                          // Timer, used to select next slide when timeout has expired.
    slideOverTime = 7000;                           // Default time for each slide

//var host = "powerpointpi.fritz!box.com:8081";      // (@home) Hostname + port where NodeJS REST-API is located(192.168.178.58)
var host = "powerpointpi.cerner.com:8081";          // Hostname + port where NodeJS REST-API is located
var imagesUrl = "http://" + host + "/images";       // REST-API address to get list of (slide) images (JPG)



function timerElapsed() {                           // called when the "timerNextSlide" elapses
    // repeat myself
    timerNextSlide = setTimeout(timerElapsed, slideOverTime);

    // Select next powerpoint slide (JPG).
    nextSlide();
}

function abortTimer() {                             // to be called when you want to stop the timer
    clearTimeout(timerElapsed);
}



function nextSlide() {                              // Custom function for change to next slide (if any available)
    // select next slide.
    slideNr = slideNr + 1;
    if (slideNr >= imagesList.length) {
        slideNr = 0;
    }

    $("#slide").attr("src", imagesList[slideNr].src);
}




// Function that executes when the DOM is fully loaded
// Also known as the jQuery .ready() handler
$(function () {

    // Set a timer and handler to select next slide (when timer has been elapsed).
    timerNextSlide = setTimeout(timerElapsed, slideOverTime);
    		
    console.log("Get slides list in JSON format from: "+ imagesUrl);
    $.get(imagesUrl, function (data) {
        console.log(data);
        imagesList = data;
    });


    // Click on the slide will select next slide
    $("#slide").click(function () {
        console.log("Handler for img.click() called.");

        abortTimer();

        nextSlide();
    });


});



