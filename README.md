# InfoDisplay

InfoDisplay is a simple solution for showing information, full screen in a kind of kiosk-mode slide show, using a client side web browser and server side NodeJS program.
It can show any number of images (JPG) and/or web pages, providing that the web URL can be embeded in 
an [iframe](http://www.w3schools.com/html/html_iframe.asp) 


## Goals

- Provide a cheap customizable kiosk-mode slide show for showing static and dynamic information
- Must run on a cheap and small device which we can hidden behind a screen/monitor/TV (we use a Raspberry PI-3)
- Device must be able to serve as a web server, so we can easily view remotely the information
- Must provide in an easy interface to create the static content so anyone (with powerpoint experience) can do this.
- Must be able to show full screen images (JPG) and dynamic web pages (also external Web URLs). 

It is designed for small companies or personal usage to show:
- Company information, created in PowerPoint and exported to JPG image files...
- ... or Personal info, like family agenda or message.
- Traffic information, in the region of the company, using Bing Map API
- Other information, Like an Agenda,Weather and other News information, using web-urls to available information on the internet.

### InfoDisplay consists of 3 project areas: 

* **[InfoDisplay Backend (InfoDisplayNJS)](#InfoDisplayNJS)** the sever backend (based on NodeJS) 
* **[InfoDisplay Frontend (InfoDisplayFE)](#IInfoDisplayFE)**  the client side frontend (based on AngularJS)
* **[Raspberry Setup Scripts (RPI-Setup)](#RPI-Setup)**  the rapsberry pi setup documentation and scripts 
 

#### <a name="InfoDisplayNJS"></a>InfoDisplay Backend (InfoDisplayNJS)
 
See [InfoDisplayNJS\README.md](./InfoDisplayNJS/README.md) for details.



#### <a name="InfoDisplayFE"></a>InfoDisplay Frontend (InfoDisplayFE)

See [InfoDisplayFE\README.md](./InfoDisplayFE/README.md) for details.


#### <a name="RPI-Setup"></a>Raspberry PI Setup documentation & scripts (RPI-Setup)
 
See [RaspberrySetup\README.md](./RaspberrySetup/README.md) for details.



## Adding documentation
Use [ESDoc](https://esdoc.org/) to generate API documentation. 
Refer to ESDoc's documentation for syntax. Run `npm run build_docs` to generate.

## Known problems

Error: jCarousel: No width/height set for items. This will cause an infinite loop. Aborting...

http://stackoverflow.com/questions/3784925/no-width-height-set-for-items-this-will-cause-an-infinite-loop-aborting

Appearantly, it uses jCarousel "under the hood", altough I see only references in te bootstrap.css files....
https://github.com/jsor/jcarousel


http://www.w3schools.com/bootstrap/bootstrap_carousel.asp


