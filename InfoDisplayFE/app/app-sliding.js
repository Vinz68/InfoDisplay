var
    timer = null;                           // Timer, used to select next slide/image/page when timeout has expired.
    slideOverTime = 7000;                   // Default time for each slide
    slideOverTimeSlide0 = 7000;             // First slide will have multiple powerpoint JPG slides. Interval will be determined later.

    slidesList = [];                        // Array with slides (html pages with embeded PowerPoint JPG) to show in a slide-show.
    slideNr = 0;                            // Currently shown slide number

    pagesList = [];                         // Array with web pages to show in a slide-show.
    tabNr = 0;                              // Currently shown tab number

    titleShowing = false;


//var host = "powerpointpi.fritz!box.com:8081"; // (@home) Hostname + port where NodeJS REST-API is located(192.168.178.58)
var host = "infodisplay.cerner.com";            // (Cerner) Hostname + port where NodeJS REST-API is located
var slidesUrl = "http://" + host + "/slides";   // REST-API address to get list of (html) slide pages (embedding the PPTX- JPG images)
var pagesUrl = "http://" + host + "/pages";     // REST-API address to get list of (html) pages


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

    showTitle(false);

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
        var title_info1 = "<h1 class='text-center'>Cerner Information Display</h1>";
        $(title_info1).appendTo("#title_info");
        var title_info2 = "<h2 class='text-center'>– InfoDisplay –</h2>";
        $(title_info2).appendTo("#title_info");

        $("#pages_data").show();

        titleShowing = true;
    }
    else if (flag == false)
    {
        $("#title_info").empty();

        $("#pages_data").hide();
        titleShowing = false;
    }
}


// Specify a function to execute when the DOM is fully loaded
// Also known as the jQuery .ready() handler
$(function () {

    showTitle(true);

    console.log("Get slides list in JSON format from: "+ slidesUrl);
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
            $.each(pagesList.pages, function(i,pageItem)
            {
                var div_data = "<div ><a href='"+pageItem.url+"'>"+pageItem.title+"</a></div>";
                $(div_data).appendTo("#pages_data");
            });

            // .. sec delay; let browser get into full screen.... (otherwise slide show not full screen / bottom row)
            timer = setTimeout(startSlideShow, 10500);
        });
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

    // Esc-pressed ?
    if (e.keyCode == 27) {
        clearTimeout(timer);
        if( $('body').hasClass('active') ){
            if( timer ) clearInterval(timer);
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
