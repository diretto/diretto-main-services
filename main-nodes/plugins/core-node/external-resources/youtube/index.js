var url = require('url');
var http = require('http');
var util = require('util');

/**
 * A demo plugin for YouTube Links.
 * 
 * @author Benjamin Erb
 */
module.exports.Plugin = {
		
	version : "0.1.0",
	
	author : "Benjamin Erb",
	
	name : "YouTube Video",
	
	id : "video/x-diretto-youtube+url",
	
	init: function(options){
		this.client = http.createClient(80, 'www.youtube.com');
	},

	validateUri : function(uri, callback) {
		
		uri = this.normalizeUri(uri);
		if(!uri){
			callback({'reason' :"URI could not be resolved."});
		}
		else{
			var uriParts = url.parse(uri);
			var request = this.client.request('GET', (uriParts.pathname || '/')+(uriParts.search || ''), {'host': "www.youtube.com"});
			request.end();
			request.on('response', function(response){
				if(response.statusCode !== 200){
					callback({'reason' :"URI does not identify a valid YouTube video."});
				}
				else{
					callback(null, uri);
				}
			});
		}
	},

	normalizeUri : function(uri) {
		var parseUri = url.parse(uri,true);
		if(parseUri.protocol && parseUri.protocol === 'http:'){
			if(parseUri.host && (parseUri.host === 'youtube.com' || parseUri.host === 'www.youtube.com')){
				if(parseUri.query && parseUri.query.v){
					return "http://www.youtube.com/watch?v="+parseUri.query.v;
				}
			}		
			else if(parseUri.host && parseUri.host === 'youtu.be' ){
				if(parseUri.pathname){
					return "http://www.youtube.com/watch?v="+parseUri.pathname.substr(1);
				}
			}
		}
		return null;
	}
};