"use strict";

const fs = require('fs');
const path = require('path');
var request = require('request');
var xml2js = require('xml-js');
var dot = require('dot');

var config = require('./newsHandler.json');

var log4js = require('log4js');
//log4js.configure(config.log4js);

const RSS_READER_TYPE			= 'rss';
const COMBINE_READER_TYPE		= 'combine';
const SHORT_DELAY				= 30000; //30 secs

var newsTemplates = [];

/******************************
 * Genertic RSS independent news item
 * denormalized and all GTML markup removed
 ******************************/
function NewsItem(title, description, image, link, datetime, source) {
	this.title = stripHTML(title);
	this.description = stripHTML(description);
	this.image = image;			// do not strip image url
	this.link = link;			// do not strig article url
	this.datetime = datetime;	// do not strip datetme (Date-object!)
	this.source = source;		// so not strip source (comes from config file (newsSources.json)
	
	/**
	 * Strip any redisual html(like) codes from a string
	 */
	function stripHTML(string) {
		if (string)
			return string.replace(/<\/?[a-z][a-z0-9]*[^<>]*>/ig, '');
		else
			return string;
	}
}

/******************************
 * output feed
 * generates HTML pages based on specified template
 * and source reader.
 ******************************/
function OutputFeed(output) {
	var logger = log4js.getLogger('OutputFeed');

	logger.debug('OutputFeed(' + output + ':....');
	
	/** OutputFeed / output
	 * {
	 *		"key": "GezondheidBE",
	 *		"title": "Gezondheid.be",
	 *		"input": "GezondheidBE",
	 *		"template": "newsTemplate.html"
	 *	}
	 *
	 * key:			Unique identifier of this output (must be unique within outputs/ preferrably no special characters/spaces/etc.)
	 * title:		Title of the feed; usually used to dispa a page title in the template
	 * input:		Feed to use as source of this output (refers to source.key)
	 * template:	html template used to render the output
	 */
	var output = output;
	var cachedHTML = null;
	
	/**
	 * Init the output Feed
	 *
	 */
	function init(){
		try {
			logger.debug('OutputFeed.init:  ....');
		
			if (output.key == null || output.key.length==0) {
				throw new Exception('OutputFeed.init: output.key is null or empty....');
			}
			if (output.template == null || output.template.length==0) {
				throw new Exception('OutputFeed.init: output.template is null or empty....');
			}
			if (output.index) {
				logger.debug('OutputFeed.init: Index feed!');
			} else {
				if (output.title == null || output.title.length==0) {
					throw new Exception('OutputFeed.init: output.title is null or empty....');
				}
				if (output.input == null || output.input.length==0) {
					throw new Exception('OutputFeed.init: output.input is null....');
				}
			}
			if (output.info == null || output.info.length==0 ) {
				output["info"] = output.key;
			}
			
			loadTemplate();
		} catch (err) {
			logger.error('OutputFeed.init: Something went wrong....', err);
		}
	};
	
	/* load the HTML dot template
	 * for this newsSources
	 */
	function loadTemplate() {
		try {
			logger.debug('OutputFeed.loadTemplate: loading template:' + output.template + '....');
			
			var tmpl = null;
			try {
				tmpl = newsTemplates[output.template];
			} catch (err) {
				// not loaded yet...
			}
			if (tmpl == null) {
				var filename = config.newsTemplateFolder + path.sep + output.template;
				fs.accessSync(filename,fs.R_OK);
				logger.debug('OutputFeed.loadTemplate: newsTemplate is accessable: ' + filename);
				
				fs.readFile(filename, 'utf8', function (err,data) {
					if (err) {
						logger.error('OutputFeed.loadTemplate: ERROR loading template!', err);
						return;
					}
					try {
						var templateFn = dot.template(data);
						logger.debug('OutputFeed.loadTemplate: newsTemplate loaded; caching it: ' + filename);	
						newsTemplates[output.template] = templateFn;
						logger.info('OutputFeed.loadTemplate: newsTemplate loaded: ' + filename);	
					} catch (err2) {
						logger.error('OutputFeed.loadTemplate: ERROR parsing template!', err2);
					}
				});
			}
		} catch (err) {
			logger.error('OutputFeed.loadTemplate: Something went wrong loading template:' + output.template + '....', err);
		}
	};
	
	function refreshFeed() {
		try {
			logger.debug('OutputFeed.refreshFeed: (' + output.key + ')....');
			
			var tmpl = null;
			try {
				tmpl = newsTemplates[output.template];
			} catch (err) {
				// not loaded yet...
			}
			if (tmpl != null) {
				var src = null;
				try {
					src = newsHandler.getFeed(output.input);
				} catch (err) {
					// not loaded yet...
				}
				if (src != null) {
					var result = tmpl( { "title": output.title, feed: src } );
					if (result != null && result.length>0) {
						logger.debug('OutputFeed.refreshFeed: (' + output.key + '): template (' + output.template + '): caching HTML...');
						cachedHTML = result;
					} else {
						// no result from template????
						logger.warn('OutputFeed.refreshFeed: (' + output.key + '): template (' + output.template + '): no result from template! (check the template...)');
			
					}
				} else {
					// source not found!
					logger.error('OutputFeed.refreshFeed: (' + output.key + '): source (' + output.inout + ') not loaded!');
				}
			} else {
				// no template (yet?)...
				logger.warn('OutputFeed.refreshFeed: (' + output.key + '): template (' + output.template + ') not (yet?) loaded!');
			}
		} catch (err) {
			logger.error('OutputFeed.refreshFeed: Something went wrong loading template:' + output.template + '....', err);
		}
	}
	function refreshIndex() {
		try {
			logger.debug('OutputFeed.refreshIndex: (' + output.key + ')....');
			
			var tmpl = null;
			try {
				tmpl = newsTemplates[output.template];
			} catch (err) {
				// not loaded yet...
			}
			if (tmpl != null) {
				var out = newsHandler.getOutputs();
				var feeds = [];
				for (var i=0; i < Object.keys(out).length; i++) {
					var outfeed = out[Object.keys(out)[i]];
					if (!outfeed.isIndex() ) {
						feeds.push(  outfeed );
					}
				}
				var result = tmpl(feeds);
				if (result != null && result.length>0) {
					logger.debug('OutputFeed.refreshIndex: (' + output.key + '): template (' + output.template + '): caching HTML...');
					cachedHTML = result;
				} else {
					// no result from template????
					logger.warn('OutputFeed.refreshIndex: (' + output.key + '): template (' + output.template + '): no result from template! (check the template...)');
				}
			} else {
				// no template (yet?)...
				logger.warn('OutputFeed.refreshIndex: (' + output.key + '): template (' + output.template + ') not (yet?) loaded!');
			}
			
		} catch (err) {
			logger.error('OutputFeed.refreshIndex: Something went wrong loading template:' + output.template + '....', err);
		}
	}

	function refresh() {
		try {
			logger.debug('OutputFeed.refresh: (' + output.key + ')....');
			
			if (output.index) 
				refreshIndex();
			else
				refreshFeed();
			 
		} catch (err) {
			logger.error('OutputFeed.refresh: (' + output.key + ') Something went wrong....', err);
		}
	}; 
	
	function items() {
		try {
			logger.debug('OutputFeed.items: (' + output.key + ')....');
			
			var src = null;
				try {
					src = newsHandler.getFeed(output.input);
					return src.items();
				} catch (err) {
					// not loaded yet...
					logger.error('OutputFeed.items: (' + output.key + '): source (' + output.inout + ') not loaded!');
				}
		} catch (err) {
			logger.error('OutputFeed.items: (' + output.key + ') Something went wrong....', err);
		}
	}
	/*
	 * GETTERS/SETTERS
	 */
	function getKey() {
		return output.key;
	}
	function getTitle() {
		logger.debug('OutputFeed.getTitle: (' + output.key + '): ' + output.title + '  ....');
		return output.title;
	}
	function getInfo() {
		logger.debug('OutputFeed.getInfo: (' + output.key + '): ' + output.info + '  ....');
		return output.info;
	}
	function getTemplate() {
		return output.template;
	};
	function isIndex() {
		return (output.index==true);
	};
	function getHTML() {
		if (cachedHTML) {
			logger.debug('OutputFeed.getHTML: (' + output.key + '): ' + cachedHTML.substring(0,100) + '  ....');
		} else {
			logger.debug('OutputFeed.getHTML: (' + output.key + '): ' + cachedHTML + '  ....');	
		}
		return cachedHTML;
	};
	
	return {
		getKey: getKey,
		getTitle: getTitle,
		getInfo: getInfo,
		getTemplate: getTemplate,
		isIndex: isIndex,
		getHTML: getHTML,
		init: init,
		items: items,
		refresh: refresh
	};
}

/**
 * CombineReader
 * - limit items per feed
 * - Combine multiple feeds into one
 * - optional sort by datetime
 * - optional limit to <n> items 
 */
function CombineReader(source) {
	var logger = log4js.getLogger('CombineReader');
	
	logger.debug('CombineReader(' + source + ':....');
	
	/** CombineReader source 
	 * {
	 *		"key": "GezondheidNews_NL",
	 *		"title": "GezondheidNews NL",
	 *		"type": "combine",
	 *		"feeds": ["Gezondheidsraad_NL", "NUGezondheid_NL", "igz_NL", "zorgvisie_NL", "ggznieuws_NL", "rivm_NL"], 
	 *		"sort": true, 
	 *		"limit1": 30,
	 *		"limit2": 5
	 *	}
	 *
	 * key:		Unique identifier of this source (must be unique within sources / preferrably no special characters/spaces/etc.)
	 * title:	Title of this feed; used as 'source' of the NewsItem
	 * type: 	must be 'combine' for a COmbineReader
	 * feeds:	array of feeds to be included in the combine (links to source.key)
	 * sort:	Do we sort the feed on date (new->old) or do we preserve the order of the source feed
	 *			when true, applied both to the source feed (before combining) and the resulting feed (after combining))
	 * limit1:	the max number of items in the resulting feed (after combining). 0: means no limit
	 * limit2:	the max number of items in a source feed (before combining). 0: means no limit
	 */
	var source = source;
	
	var rssTitle= null;		// rss Title of the feed (as specified by the site generating the rss feed); one of the source titles will be used
	var rssDate = null;		// date of this feed (populated by the source feeds; newest date/time of all source feeds)
	var newsItems = [];		// array of NewsItem object as last retrieved and generated from the sources
	
	var newRssDate = null;	// new Date of the feed (used while refreshing)
	var newNewsItems = [];	// new Array of NewsItems (used while refreshing)
	
	/******************************
	 * init this reader
	 ******************************/
	function init() {
		try {
			logger.debug('CombineReader.init: ....');
			
			// test key (non empty string)
			if (source.key == null || source.key.length==0) {
				throw new Exception('CombineReader.init: source.key is null or empty....');
			}
			// test source.type ('combinelimit')
			if (source.type == null || source.type.length==0 || source.type!=COMBINE_READER_TYPE ) {
				throw new Exception('CombineReader.init: source.type is null or empty or not equal "' + COMBINE_READER_TYPE + '"....');
			}
			// test source.feeds (array, with elements)
			if (source.feeds == null || source.feeds.length==0) {
				throw new Exception('CombineReader.init: source.feeds is null or empty....');
			}
			// test source.sort (boolean)
			if (source.sort == null ) {
				logger.info('CombineReader.init: setting sort=true for feed "' + source.key + '"....');
				source.sort=true;
			} else {
				source.sort = (source.sort==true)
			}
			// test sourse.limit1 (numeric>=0)
			if (source.limit1 == null ) {
				logger.info('CombineReader.init: setting limit1=0 for feed "' + source.key + '"....');
				source.limit1 = 0;
			} else {
				if (Number.isInteger(source.limit1)) {
					source.limit1 = Number.parseInt(source.limit1);
					if (source.limit1<0) {
						source.limit1=0;
					}
				} else {
					logger.debug('CombineReader.init: setting limit1=0 for feed (not an integer)"' + source.key + '"....');
					source.limit1 = 0;
				}
			}
			// test sourse.limit2 (numeric>=0)
			if (source.limit2 == null ) {
				logger.debug('CombineReader.init: setting limit2=0 for feed "' + source.key + '"....');
				source.limit2 = 0;
			} else {
				if (Number.isInteger(source.limit2)) {
					source.limit2 = Number.parseInt(source.limit2);
					if (source.limit2<0) {
						source.limit2=0;
					}
				} else {
					logger.info('CombineReader.init: setting limit2=0 for feed (not an integer)"' + source.key + '"....');
					source.limit2 = 0;
				}
			}
		} catch (err) {
			logger.error('CombineReader.init: Something went wrong....', err);
		}
	}
	
	/******************************
	 * compare function for sorting on datetime
	 ******************************/
	function compareDate(a,b) {
		logger.debug('CombineReader.compareDate: compare...');
		if (a.datetime < b.datetime)
			return 1;
		if (a.datetime > b.datetime)
			return -1;
		return 0;
	}
	
	/******************************
	 * refresh this reader
	 ******************************/
	function refresh() {
		try {
			logger.debug('CombineReader.refresh (' + source.key + ')....');
		
			newNewsItems = [];
			newRssDate = null;
			
			source.feeds.forEach(function(element,index, array) {
				logger.debug('CombineReader.refresh: (' + source.key + ') feed : ' + element);
				
				var reader = null;
				try {
					reader = newsHandler.getFeed(element);
				} catch (err2) {
					logger.warn('CombineReader.refresh: (' + source.key + ') Feed not found : ' + element);
				}
				if (reader != null ) {
					var it = reader.items();
					logger.debug('CombineReader.refresh: feed : ' + element + '. Adding items...' + it.length);
					
					// store latest refresh date:
					if (null==newRssDate) {
						newRssDate = reader.getPubDate();
					} else {
						if (reader.getPubDate()!= null && reader.getPubDate()>newRssDate) {
							newRssDate = reader.getPubDate();
						}
					}
					// store a title (does not make sense for a combine reader, though....)
					if (null != reader.getTitle()) {
						rssTitle = reader.getTitle();
					}
					
					if (source.sort) {
						logger.debug('CombineReader.refresh: (' + source.key + ')sorting source items...');
						it.sort(compareDate);
					}
					if (source.limit2>0 && it.length>source.limit2 ) {
						logger.debug('CombineReader.refresh: limiting feed items to ' + source.limit2 + '...');
						it = it.slice(0,source.limit2);
					}
					// concat does not work for object arrays...
					//newNewsItems.concat(it);
					for (var i=0; i < it.length; i++) {
						newNewsItems.push( it[i] );
					}
				}
			});
			//console.log(newNewsItems);
			if (source.sort) {
				logger.debug('CombineReader.refresh: (' + source.key + ')sorting items...');
				newNewsItems.sort(compareDate)
			}
			
			if (source.limit1>0 && newNewsItems.length>source.limit1 ) {
				logger.debug('CombineReader.refresh: (' + source.key + ')limiting total items to ' + source.limit1 + '...');
				newNewsItems = newNewsItems.slice(0,source.limit1);
			}
			logger.info('CombineReader.refresh: (' + source.key + ') storing news items (' + newNewsItems.length +')...');
			newsItems = newNewsItems;
			rssDate = newRssDate;
			
		} catch (err) {
			logger.error('CombineReader.refresh: (' + source.key + ') Something went wrong....', err);
		}
	}
	
	/******************************
	 * return the items in this feed
	 ******************************/
	function items() {
		return newNewsItems;
	}

	/*
	 * GETTERS/SETTERS
	 */
	function getKey() {
		return source.key;
	}
	function getPubDate() {
		return rssDate;
	}
	function getTitle() {
		return rssTitle;
	}
	return {
		init: init,
		items: items,
		refresh: refresh,
		getPubDate: getPubDate,
		getTitle: getTitle,
		getKey: getKey
	};
}

/**
 * RSS FeedReader
 *
 */
function FeedReader(source) {
	var logger = log4js.getLogger('FeedReader');
	
	logger.debug('FeedReader(' +  JSON.stringify(source) + ':....');
	
	/**  FeedReader / source
	 * {
	 *		"key": "Gezondheidsraad",
	 *      "title": "some title"
	 *		"type": "rss",
	 *		"url": "https://www.gezondheidsraad.nl/nl/nieuws/feed",
	 *		"fieldmapping": {
	 *			"description":  {"source": "description", "regex": "(.*)<p class=\"field-field_intro\">(.*)</p>(.*)", "replace": "$2" },
	 *			"image":  {"source": "description", "regex": "(.*)<img src=\"(.*)\" width=\"\\d+\" height=\"\\d+\"(.*)", "replace": "$2" }
	 *		},
	 *      "ignoreNoPubDate": false,
	 *      "maxlenths": {
	 *			"title": 100,
	 *			"description": 300
	 * 		}
	 *	}
	 *
	 * key:				Unique identifier of this source (must be unique within sources / preferrably no special characters/spaces/etc.)
	 * title:			Title of this feed; used as 'source' of the NewsItem
	 * type:			must  be 'rss' for a FeedReader
	 * url:				url of the feed; must return an rss feed
	 * ignoreNoPubDate:	If a feed contains no rss.channel.pubDate and no rss.channel.lastBuildDate a warning is written into the log
	 *  				setting this to tru suppresses the warning.
	 * 
	 * fieldmapping
	 *			Mapping object in case the site is generting html content 
	 *          - with several elements in one element (for example image & description in the description field)
	 *      	- contains a lot of markup which we do not want
	 * Each element:
	 * key:		field the mapping is for (description, title, image, link, datetime)
	 *   source: 	source field used for this field (description, title, image, link, datetime)
	 *   regex:		regular expression used to search/replace on the source field
	 *   replace:	replace pattern used
	 * 
	 * See (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace) for more information 
	 * and (https://regex101.com/) to test the expression
	 */
	var source = source;	// source configuration (source element from newsSources.json)
	
	
	var rssTitle= null;		// rss Title of the feed (as specified by the site generating the rss feed)
	var rssDate = null;		// date of this feed (populated by the site generating the feed, or (if no date is psecified by the site) the last datetime of retrieveal)
	var newsItems = [];		// array of NewsItem object as last retrieved from the source
	
	var newRssDate = null;	// new Date of the feed (used while refreshing)
	var newNewsItems = [];	// new Array of NewsItems (used while refreshing)
	
	/**
	 * Init the Feed reader
	 *
	 */
	function init(){
		try {
			logger.debug('FeedReader.init: ....');
		
			if (source.key == null || source.url.length==0) {
				throw new Exception('FeedReader.init: source.key is null or empty....');
			}
			if (source.type == null || source.type.length==0 || source.type!=RSS_READER_TYPE ) {
				throw new Exception('FeedReader.init: source.type is null or empty or not equal "' + RSS_READER_TYPE + '"....');
			}
			if (source.url == null || source.url.length==0) {
				throw new Exception('FeedReader.init: source.url is null or empty....');
			}
			if (source.title == null || source.title.length==0 ) {
				throw new Exception('FeedReader.init: source.title is null or empty....');
			}
			if (source.ignoreNoPubDate != null && typeof(source.ignoreNoPubDate) != "boolean" ) {
				throw new Exception('FeedReader.init: source.ignoreNoPubDate is not a boolean....');
			}
			if (source.ignoreNoPubDate == null) {
				// add the item (defaults to false = DoNotIgnore....)
				logger.debug('FeedReader.init: adding ignoreNoPubDate=false to feed (key: ' + source.key + ')....');
				source["ignoreNoPubDate"] = false;
			}
		} catch (err) {
			logger.error('FeedReader.init: Something went wrong....', err);
		}
	};
	
	/**
	 * newsItemFromRssItem(element, index, array)
	 * - element: RSS news item object
	 * - index: index of element in array
	 * - array: array being iterated
	 */
	function newsItemFromRssItem(element, index, array) {
		try {
			logger.debug('FeedReader.newsItemFromRssItem: '+ source.key +':' + index + '....');
			
			var title 		= ''
			var description = '';
			var image 		= '';
			var link 		= '';
			var datetime 	= '';
			/********************************
			 * Title
			 ********************************/
			try {
				title = element.title._text;
				if (null==title || title.length==0) {
					// not in text, try cdata:
					title = element.title._cdata;
					if (null==title || title.length==0) {
						logger.warn('FeedReader.newsItemFromRssItem: '+ source.key +' element.title empty...' );
						//console.log(element.description);
						title='';
					}
				}
			} catch (e) {
				logger.warn('FeedReader.newsItemFromRssItem: '+ source.key +' element.title empty/non-existant...');
			}
			/********************************/
			
			/********************************
			 * Description
			 ********************************/
			try {
				description = element.description._text;
				if (null==description || description.length==0) {
					// not in text, try cdata:
					description = element.description._cdata;
					if (null==description || description.length==0) {
						logger.warn('FeedReader.newsItemFromRssItem: '+ source.key +' element.description empty...' );
						//console.log(element.description);
						description='';
					}
				}
			} catch (e) {
				logger.warn('FeedReader.newsItemFromRssItem: '+ source.key +' element.description empty/non-existant...');
			}
			/********************************/
			
			/*********************************
			 * Image
			 *********************************/
			try {
				if (element.enclosure._attributes.url) {
					image = element.enclosure._attributes.url;
				}
			} catch (e) {
				logger.debug('FeedReader.newsItemFromRssItem: '+ source.key +' element.enclosure._attributes.url empty/non-existant...');
			}
			try {
				if (element['media:content']._attributes.url) {
					image = element['media:content']._attributes.url;
				}
			} catch (e) {
				logger.debug('FeedReader.newsItemFromRssItem: '+ source.key +' element[\'media:content\']._attributes.url empty/non-existant...');
			}
			if (image == null) {
				logger.warn('FeedReader.newsItemFromRssItem: '+ source.key +' element[\'media:content\']._attributes.url and element.enclosure._attributes.url empty/non-existant...');
				image='';
			}
			/********************************/
			
			/********************************
			 * Link
			 ********************************/
			try {
				link = element.link._text;
			} catch (e) {
				logger.warn('FeedReader.newsItemFromRssItem: '+ source.key +' element.link empty/non-existant...');
			}
			if (null==link) link = '';
			/********************************/
			
			/********************************
			 * Date/Time
			 ********************************/
			try {
				if (element.pubDate._text) {
					datetime = element.pubDate._text;
				}
			} catch (e) {
				logger.warn('FeedReader.newsItemFromRssItem: '+ source.key +' element.pubDate empty/non-existant (or cannot be parsed)...');
				//console.log(element);
			}
			
			var title2 		 = title;
			var description2 = description;
			var image2 		 = image;
			var link2 		 = link;
			var datetime2 	 = datetime;
			
			if (source.fieldmapping) {
				if (source.fieldmapping.description) {
					description2 = mapFields(source.fieldmapping.description, title,description, image, link, datetime);
				}
				if (source.fieldmapping.title) {
					title2 = mapFields(source.fieldmapping.title, title,description, image, link, datetime);
				}
				if (source.fieldmapping.image) {
					image2 = mapFields(source.fieldmapping.image, title,description, image, link, datetime);
				}
				if (source.fieldmapping.link) {
					link2 = mapFields(source.fieldmapping.link, title,description, image, link, datetime);
				}
				if (source.fieldmapping.datetime) {
					datetime2 = mapFields(source.fieldmapping.datetime, title,description, image, link, datetime);
				}
			}
			// make sure the datetime is an actual Date()
			if (datetime2 && datetime2.length>0) {
				datetime2 = new Date(datetime2);
			} else {
				// fallback, use now()!
				logger.warn('FeedReader.newsItemFromRssItem: using now() as datetime for "' + datetime2 + '"....');
				datetime2 = new Date();
			}
			
			var i = new NewsItem(title2, description2, image2, link2, datetime2, source.title);
			
			newNewsItems.push(i);
		} catch (err) {
			logger.error('FeedReader.newsItemFromRssItem: '+ source.key +' Something went wrong....', err);
		}
	};
	
	/******************************
	 * mapFields(fieldmapping, title, description, image, link, datetime
	 * Map a field's content based on the supplied fieldmapping and the
	 * values of the fields title,description, image, link and datetime
	 *
	 * example
	 * fieldmapping: {
	 *	 "image":  {"source": "description", "regex": "(.*)<img src=\"(.*)\" width=\"\\d+\" height=\"\\d+\"(.*)", "replace": "$2" }
	 *    }
	 * fills the image field with a substring of the description field (img-src value...)
	 ******************************/
	function mapFields(fieldmapping, title, description, image, link, datetime) {
		try {
			logger.debug('FeedReader.mapFields: ....');
			
			var source = '';
			switch (fieldmapping.source) {
				case 'title': 
					source = title;
					break;
				case 'description':
					source = description;
					break;
				case 'image':
					source = image;
					break;
				case 'link':
					source = link;
					break;
				case 'datetime':
					source = datetime;
					break;
			}
			if (source && source.length>0) {
				if (! fieldmapping.RegExp ) {
					var regex = new RegExp(fieldmapping.regex);
					fieldmapping.RegExp = regex;
				}
				if ( fieldmapping.RegExp ) {
					var result = source.replace(fieldmapping.RegExp, fieldmapping.replace);
					logger.debug('FeedReader.mapFields: mapped to: ' + result + '\nregex:' + fieldmapping.RegExp + ' \nreplace: ' + fieldmapping.replace);
					return result;
				} else {
					return null;
				}
			} else {
				logger.warn('FeedReader.mapFields: ignoring mapping (source ' + fieldmapping.source + ' is empty)....');
				return null;
			}
		} catch (err) {
			logger.error('FeedReader.mapFields: Something went wrong....', err);
		}
	}
	
	/******************************
	 * Refresh()
	 * Refresh the all feeds...
	 ******************************/
	function refresh(){
		try {
			logger.debug('FeedReader.refresh: ....');
		
			request(source.url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					// reste new values:
					newNewsItems = [];
					newRssDate = null;
					
					var result = null;
					try {
						result = xml2js.xml2js(body, {compact: true, trim: true, ignoreDeclaration: true, ignoreAttributes: false, ignoreComment: true});
					} catch (err2) {
						logger.error('FeedReader.refresh: Error parsing feed (key: ' + source.key + ', url: ' + source.url + ')! Feed will be ignored / not retrieved...', err2);
					}
					if ( result && result.rss ) {
						// result contains an rss section
						if (result.rss.channel) {
							if (result.rss.channel.title) {
								rssTitle = result.rss.channel.title._text;
							} else {
								logger.warn('FeedReader.refresh: Feed "' + source.key + '" has no title?');
								//console.log(result.rss);
							}
							if (result.rss.channel.lastBuildDate) {
								//lastBuildDate
								rssDate = result.rss.channel.lastBuildDate._text;
								try {
									rssDate = new Date(rssDate);
								} catch (err2) {
									logger.warn('FeedReader.refresh: Feed "' + source.key + '" has unparseble lastBuildDate? : ' + rssDate);
									rssDate = new Date();
								}
							} else {
								logger.debug('FeedReader.refresh: Feed "' + source.key + '" as no lastBuildDate?');
								// try pubDate
								if (result.rss.channel.pubDate) {
									rssDate = result.rss.channel.pubDate._text;
									try {
										rssDate = new Date(rssDate);
									} catch (err2) {
										logger.warn('FeedReader.refresh: Feed "' + source.key + '" has unparseble pubDate? : ' + rssDate);
										rssDate = new Date();
									}
								} else {
									if (! source.ignoreNoPubDate) {
										logger.warn('FeedReader.refresh: Feed "' + source.key + '" has no pubDate and no lastBuildDate ?');
									}
									rssDate = new Date();
								}
							}
							
							if (result.rss.channel.item) {
								result.rss.channel.item.forEach(newsItemFromRssItem);
							}
						}
					}
					
					if (newNewsItems && newNewsItems.length) {
						logger.info('FeedReader.refresh: storing new news items(' + newNewsItems.length + ')...');
						newsItems = newNewsItems;
						//console.log(this.newsItems);
					} else {
						logger.warn('FeedReader.refresh: NO new news items retrieved (' + source.key + ')!');
					}
				} else {
					if (error) {
						logger.error('FeedReader.refresh: Error loading RSS: ' + source.key + ' url: ' + source.url, error);	
					} else {
						logger.warn('FeedReader.refresh: Unable to load RSS: ' + source.key + ' url: ' + source.url);
					}
				}
			});
		} catch (err) {
			logger.error('FeedReader.refresh: Something went wrong....', err);
		}
	};
	
	/******************************
	 * Return all newsItems in this feed
	 ******************************/
	function items() {
		return newNewsItems;
	}
	
	/*
	 * GETTERS/SETTERS
	 */
	function getKey() {
		return source.key;
	}
	function getUrl() {
		return source.url;
	}
	function getPubDate() {
		return rssDate;
	}
	function getTitle() {
		return rssTitle;
	}
	return {
		getKey: getKey,
		getUrl: getUrl,
		getPubDate: getPubDate,
		getTitle: getTitle,
		items: items,
		init: init,
		refresh: refresh
	};
}


/**
 * News Handler
 *
 */
var newsHandler = (function() {
	var logger = log4js.getLogger('NewsHandler');
	
	logger.debug('newsHandler...');
	
	const MIN_DELAY = 5000;
	
	var timerIDSources = 0;				// timer instance ID for source refresh loop
	var timerIDOutputs = 0;				// timer instance ID for outputs refresh loop
	var shortDelayCountSources = 0;		// nr of times a shortdelay has been used by refreshSources
	var shortDelayCountOutputs = 0;		// nr of times a shortdelay has been used by refreshOutputs
	
	var refreshingSources = false;		// used to prevent 2 times concurrent refresh
	var refreshingOutputs = false;		// used to prevent 2 times concurrent refresh
	var feedReaders = [];				// source feeds
	var outputFeeds = [];				// output feeds
	
	/***************************
	 * init()
	 * Initialize the news Handler & start processing
	 ***************************/
	function init() {
		try {
			logger.debug('newsHandler.init: Starting init....');
			
			fs.accessSync(config.newsTemplateFolder,fs.R_OK);
			logger.debug('newsHandler.init: newsTemplateFolder is accessable: ' + config.newsTemplate);
			
			fs.accessSync(config.newsSources,fs.R_OK);
			logger.debug('newsHandler.init: newsSources is accessable: ' + config.newsSources);
			
			var newsSrc = require(config.newsSources);
			if (! newsSrc.sources.length > 0 ) {
				throw new Exception('newsHandler.init: No newsSources (sources [{key,title,url}]) defined in ' + config.newsSources);
			}
			
			logger.debug('newsHandler.init: checking refreshDelay>' + MIN_DELAY + '...');
			if (config.refreshDelay < MIN_DELAY) {
				config.refreshDelay = MIN_DELAY;
			}
			
			/* Read news template(s) */
			newsSrc.sources.forEach(function (element, index, array) { 
				logger.info('newsHandler.init: creating FeedReader for source: ' + element.key + '....');
				
				var reader = null;
				if (element.type) {
					switch (element.type) {
						case RSS_READER_TYPE:
							reader = new FeedReader(element);
							break;
						case COMBINE_READER_TYPE:
							reader = new CombineReader(element);
							break;
						default:
							logger.error('newsHandler.init: UNKNOWN reader type: ' + element.type + '!');
							break;
					}
				}
				reader.init();
				logger.debug('newsHandler.init: FeedReader initialized: ' + reader.getKey() + '.');
				
				// store the reader
				feedReaders[reader.getKey()] = reader;
				
			});
			logger.info('newsHandler.init: FeedReaders loaded.');
			
			newsSrc.outputs.forEach(function (element, index, array) { 
				logger.info('newsHandler.init: creating outputFeed for output: ' + element.key + '....');
				var out = new OutputFeed(element);
				out.init();
				logger.debug('newsHandler.init: OutputFeed initialized: ' + out.getKey() + '.');
				
				// store the outputfeeder
				outputFeeds[out.getKey()] = out;
				
			});
			logger.info('newsHandler.init: OutputFeeds loaded.');
			
			timerIDSources = setTimeout(refreshSources,SHORT_DELAY);
			timerIDOutputs = setTimeout(refreshOutputs,SHORT_DELAY);
			
		} catch (err) {
			logger.error('newsHandler.init: Something went wrong...', err);
		}
	};
	
	/***************************
	 * refreshSources
	 * Refresh all content (feeds )
	 ***************************/
	function refreshSources() {
		try {
			logger.info('newsHandler.refreshSources: Refreshing data....');
			
			if (!refreshingSources) {
				refreshingSources  = true;
				
				logger.debug('newsHandler.refreshSources: Refreshing feeds....');
				for(var index in feedReaders) {
					var feed = feedReaders[index];
					if (feed) {
						feed.refresh();
					}
				}
				
				if (shortDelayCountSources < 3) {
					timerIDSources = setTimeout(refreshSources, SHORT_DELAY);
					shortDelayCountSources++;
				} else {
					timerIDSources = setTimeout(refreshSources, config.refreshDelaySource);
				}
				logger.debug('newsHandler.refreshSources: Refreshing done.');
				refreshingSources  = false;
			}
		} catch (err) {
			logger.error('newsHandler.refreshSources: Something went wrong...', err);
			// reset the timer:
			timerIDSources = setTimeout(refreshSources,SHORT_DELAY);
			shortDelayCountSources = 0;
			refreshingSources  = false;
		}
	};
	/***************************
	 * refreshOutputs
	 * Refresh all content (outputs)
	 ***************************/
	function refreshOutputs() {
		try {
			logger.info('newsHandler.refreshOutputs: Refreshing data....');
			
			if (!refreshingOutputs) {
				refreshingOutputs  = true;
				
				logger.debug('newsHandler.refreshOutputs: Refreshing outputs....');
				for(var index in outputFeeds) {
					var feed = outputFeeds[index];
					if (feed) {
						feed.refresh();
					}
				}
				
				if (shortDelayCountOutputs < 3) {
					timerIDOutputs = setTimeout(refreshOutputs, SHORT_DELAY);
					shortDelayCountOutputs++;
				} else {
					timerIDOutputs = setTimeout(refreshOutputs, config.refreshDelayOutput);
				}
				logger.debug('newsHandler.refreshOutputs: Refreshing done.');
				refreshingOutputs  = false;
			}
		} catch (err) {
			logger.error('newsHandler.refreshOutputs: Something went wrong...', err);
			// reset the timer:
			timerIDOutputs= setTimeout(refreshOutputs,SHORT_DELAY);
			shortDelayCountOutputs = 0;
			refreshingOutputs  = false;
		}
	};
	/***************************
	 * getNews HTML page
	 ***************************/
	function getNews(source) {
		try {
			logger.debug('newsHandler.getNews: source: ' + source + ' ...');
			var html = null;
			
			var of = null;
			try {
				of = outputFeeds[source];
			} catch (err2){
				// not found
			}
			if (of) {
				return of.getHTML()
			} else {
				logger.warn('newsHandler.getNews: feed NOT found !');
			}
			return null;
		} catch (err) {
			logger.error('newsHandler.getNews: Something went wrong...', err);
		}
	};
	/***************************
	 * getNewsItems page
	 ***************************/
	function getNewsItems(source) {
		try {
			logger.debug('newsHandler.getNewsItems: source: ' + source + ' ...');
			var items = null;
			
			var of = null;
			try {
				of = outputFeeds[source];
			} catch (err2){
				// not found
			}
			if (of) {
				return of.items();
			} else {
				logger.warn('newsHandler.getNewsItems: feed NOT found !');
			}
			return null;
		} catch (err) {
			logger.error('newsHandler.getNewsItems: Something went wrong...', err);
		}
	};
	/***************************
	 * getIndexHTML
	 * returns an index html page which
	 * showns all output feeds that are defined
	 ****************************/
	function getIndexHTML(){
		try {
			logger.debug('newsHandler.getIndexHTML: ' + Object.keys(outputFeeds).length + '...');
			//console.log(outputFeeds);
			
			var of = null;
			try {
				of = outputFeeds[config.newsIndexFeed];
			} catch (err2){
				// not found
			}
			if (of) {
				return of.getHTML()
			} else {
				logger.warn('newsHandler.getIndexHTML: index NOT found !');
			}
		} catch (err) {
			logger.error('newsHandler.getIndexHTML: Something went wrong...', err);
		}
		return null;
	};
	
	/***************************
	 * getFeed
	 * returns a *Reader based on the supplied key
	 /***************************/
	function getFeed(key) {
		try {
			logger.debug('newsHandler.getFeed: ' + key + '...');
			
			return feedReaders[key];
		} catch (err) {
			logger.error('newsHandler.getFeed: Something went wrong...', err);
			return null;
		}
	}
	/***************************
	 * getOutputs
	 * returns all OutputFeeds
	 /***************************/
	function getOutputs() {
		try {
			logger.debug('newsHandler.getOutputs: ...');
			
			return outputFeeds;
		} catch (err) {
			logger.error('newsHandler.getOutputs: Something went wrong...', err);
			return null;
		}
	}
	/* public API: */
	return {
		init: init,
		getFeed: getFeed,
		getOutputs: getOutputs,
		getNews: getNews,
		getNewsItems: getNewsItems,
		getIndexHTML: getIndexHTML
	};
	
}());

module.exports = newsHandler;