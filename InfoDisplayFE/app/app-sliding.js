var
    timer = null;                           // Timer, used to select next slide/image/page when timeout has expired.
    slideOverTime = 7500;                   // Default time for each slide
    slideOverTimeSlide0 = 7500;             // First slide will have multiple powerpoint JPG slides. Interval will be determined later.

    slidesList = [];                        // Array with slides (html pages with embeded PowerPoint JPG) to show in a slide-show.
    slideNr = 0;                            // Currently shown slide number

    pagesList = [];                         // Array with web pages to show in a slide-show.
    tabNr = 0;                              // Currently shown tab number

    titleShowing = false;

    refreshTimer = null;                    // Refresh Timer, used to refresh/reload the HTML pages to keep them up-to-date
    refreshTime = 10 * 60000;               // Refresh timer time out xx * 1 minute



//var host = "powerpointpi.fritz!box.com:8081"; // (@home) Hostname + port where NodeJS REST-API is located(192.168.178.58)
var host = "infodisplay.cerner.com";            // (Cerner) Hostname + port where NodeJS REST-API is located
var slidesUrl = "http://" + host + "/slides";   // REST-API address to get list of (html) slide pages (embedding the PPTX- JPG images)
var pagesUrl = "http://" + host + "/pages";     // REST-API address to get list of (html) pages


// Loading of the web pages (in iframes)
function load_tab(url) {
    $('.tabs').append('<iframe class="tab" frameborder="0" height="'+$(window).height()+'" width="'+$(window).width()+'" scrolling="no" seamless="seamless" src="'+url+'"></iframe>');
}


function refreshHtmlPages() {

    var refreshMsg = "RefreshHtmlPages at: "+ new Date().toLocaleString();
    console.log(refreshMsg);

    // Ask server for list which pages should be shown, and load the pages
    getSlidesList();

    refreshTimer = setTimeout(refreshHtmlPages, refreshTime);
}


function loadHtmlPages() {
    viewport = document.querySelector("meta[name=viewport]");
    viewport.setAttribute('content', $('#aspect').val());

    // (re)Load HTML pages 
    $('.tabs').empty();
    for (var i = 0; i < pagesList.pages.length; i++) {
        console.log(pagesList.pages[i].url);
        load_tab(pagesList.pages[i].url)
    }
}

// start slide show
function startSlideShow() {

    showTitle(false);

    /* loadHtmlPages(); */

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
            timer = setTimeout(nextTabpage, pagesList.pages[tabNr].interval);
            return;
        }
    }
    $('.tabs .tab:first').addClass('active'); // display first if no next
    tabNr=0;
    timer = setTimeout(nextTabpage, pagesList.pages[tabNr].interval);
}

function showTitle(flag) {

    if ((flag == true) && (titleShowing == false))
    {
        $("#title_info").show();

        $("#pages_data").show();

        titleShowing = true;
    }
    else if (flag == false)
    {
        $("#title_info").hide();

        $("#pages_data").hide();
        titleShowing = false;
    }
}

function getSlidesList() {
    console.log("Get slides list in JSON format from: " + slidesUrl);
    $.get(slidesUrl, function (data) {
        console.log(data);
        slidesList = data;

        console.log("Get pages list in JSON format from: " + pagesUrl);
        $.get(pagesUrl, function (data) {
            console.log(data);
            pagesList = slidesList;

            // Merge slidesList and pagesList to get list of all pages to be shown in the slideshow
            pagesList.pages = pagesList.pages.concat(data.pages);

            // At startup show list of pages for the slide-show
            $("#pages_data").empty();
            $.each(pagesList.pages, function (i, pageItem) {
                var div_data = "<div class='text-center' ><a href='" + pageItem.url + "'>" + pageItem.title + "</a></div>";
                $(div_data).appendTo("#pages_data");
            });

            // Load the HTML pages
            loadHtmlPages()
        });
    });

}

// Specify a function to execute when the DOM is fully loaded
// Also known as the jQuery .ready() handler
$(function () {

    var refreshMsg = "InfoDisplay started at: " + new Date().toLocaleString();
    console.log(refreshMsg);

    showTitle(true);

    // First page title
    var title_info1 = "<h1 class='text-center'>Cerner Information Display</h1>";
    $(title_info1).appendTo("#title_info");
    var title_info2 = "<h2 class='text-center'>– InfoDisplay –</h2>";
    $(title_info2).appendTo("#title_info");

    // Auto Reload/Refresh HTML pages
    refreshTimer = setTimeout(refreshHtmlPages, refreshTime);

    // Ask server for list which pages should be shown, and lload HTML pages
    getSlidesList();

    // .. sec delay; let browser get into full screen.... (otherwise slide show not full screen / bottom row)
    timer = setTimeout(startSlideShow, 12500);

});



// Assure full screen.
$(window).resize(function () {
    $('.tabs, .tabs .tab').height($(window).height()).width($(window).width());
    $('.tabs').height($(window).height()).width($(window).width());
});


$(window).keyup(function (e) {

    // Esc-pressed ?
    if (e.keyCode == 27) {
        clearTimeout(timer);
        clearTimeout(refreshTimer);
        if( $('body').hasClass('active') ){
            if (timer) clearInterval(timer);
            if (refreshTimer) clearInterval(refreshTimer);
            $('body').removeClass('active');
            $('.tabs').empty();
        }

        showTitle(true);
    }
    // '+' pressed ?
    else if ((e.keyCode == 43) || (e.keyCode == 187) )
    {
        clearTimeout(timer);
        nextTabpage();

    }
});
