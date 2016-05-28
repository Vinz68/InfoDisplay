var
    timer = null;                           // Timer, used to select next slide/image/page when timeout has expired.
    slideOverTime = 7000;                   // Default time for each slide
    slideOverTimeSlide0 = 7000;             // First slide will have multiple powerpoint JPG slides. Interval will be determined later.

    imagesList = [];                        // Array with images/JPG to show (as an image in a slide-show on tab-1).
    slideNr = 0;                            // Currently shown slide number

    pagesList = [];                         // Array with web pages to show (in a slide-show on tab-2 and further).
    tabNr = 0;                              // Currently shown tab number


//var host = "powerpointpi.fritz!box.com:8081"; // (@home) Hostname + port where NodeJS REST-API is located(192.168.178.58)
var host = "powerpointpi.cerner.com:8081";     // (Cerner) Hostname + port where NodeJS REST-API is located
var imagesUrl = "http://" + host + "/images";  // REST-API address to get list of (slide) images (JPG)
var pagesUrl = "http://" + host + "/pages";    // REST-API address to get list of (html) pages


// Loading of the web pages (in iframes)
function load_tab(url) {
    $('.tabs').append('<iframe class="tab" frameborder="0" height="'+$(window).height()+'" width="'+$(window).width()+'" scrolling="no" seamless="seamless" src="'+url+'"></iframe>');
}

function loadHtmlPages() {
    viewport = document.querySelector("meta[name=viewport]");
    viewport.setAttribute('content', $('#aspect').val());

    // (re)Load HTML pages 
    for (var i = 0; i < pagesList.pages.length; i++) {
        console.log(pagesList.pages[i].url);
        load_tab(pagesList.pages[i].url)
    }
}

// start slide show
function startSlideShow() {

    loadHtmlPages();

    // Set first TAB active, and start timer for the slideshow
    $('body').addClass('active');
    if ($('.tabs .tab').length > 1) {
        // Set a timer and handler to select next tab (when timer has been elapsed).
        timer = setTimeout(nextTabpage, 500);
    } else {
        $('.tabs .tab:first').addClass('active')
    }
}


// Next Tab
function nextTabpage() {
    /* Rotate the tabs */
    var up = $('.tabs .tab.active'); // get active
    if( up.length>0 ) {
        up.removeClass('active');
        if( up.next().length>0 ) {
            up.next().addClass('active');
            tabNr++;
            setTimeout(nextTabpage, pagesList.pages[tabNr].interval);
            return;
        }
    }
    $('.tabs .tab:first').addClass('active'); // display first if no next
    tabNr=0;
    setTimeout(nextTabpage, slideOverTimeSlide0);
}



// Specify a function to execute when the DOM is fully loaded
// Also known as the jQuery .ready() handler
$(function () {

    console.log("Get slides list in JSON format from: "+ imagesUrl);
    $.get(imagesUrl, function (data) {
        console.log(data);
        imagesList = data;

        // calculate first slide duration before the slide occurs (depends on number of slids).
        slideOverTimeSlide0 = imagesList.length * 7000;
    });

    console.log("Get pages list in JSON format from: " + pagesUrl);
    $.get(pagesUrl, function (data) {
        console.log(data);
        pagesList = data;

        // At startup show list of pages for the slide-show
        $.each(pagesList.pages, function(i,pageItem)
        {
            var div_data = "<div ><a href='"+pageItem.url+"'>"+pageItem.title+"</a></div>";
            $(div_data).appendTo("#pages_data");
        });

        // .. sec delay; let browser get into full screen.... (otherwise slide show not full screen / bottom row)
        timer = setTimeout(startSlideShow, 10500);
    });

    		
    /* mouse move then show the navbar */
    $('#run').click(function() {

    });

});



// Assure full screen.
$(window).resize(function () {
    $('.tabs, .tabs .tab').height($(window).height()).width($(window).width());
    $('.tabs').height($(window).height()).width($(window).width());
});


$(window).keyup(function (e) {
    if (e.keyCode == 27){ 
        if( $('body').hasClass('active') ){
            if( timer ) clearInterval(timer);
            $('body').removeClass('active');
            $('.tabs').empty();
        }
    }
});
