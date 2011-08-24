var url = require('url');
var http = require('http');
var util = require('util');

/**
 * A plugin for YouTube Links
 * 
 * @author Benjamin Erb
 */
module.exports.Plugin = {
		
	version : "0.1.0",
	
	author : "Benjamin Erb",
	
	name : "Tweet on Twitter",
	
	id : "text/x-diretto-twitter+url",
	
	init: function(options){
		this.client = http.createClient(80, 'www.twitter.com');
	},

	validateUri : function(uri, callback) {
		
		uri = this.normalizeUri(uri);
		if(!uri){
			callback({'reason' :"URI could not be resolved."});
		}
		else{
			var uriParts = url.parse(uri);
			var request = this.client.request('GET', (uriParts.pathname || '/')+(uriParts.search || ''), {'host': "twitter.com"});
			request.end();
			request.on('response', function(response){
				if(response.statusCode !== 200){
					callback({'reason' :"URI does not identify a public/valid tweet."});
				}
				else{
					callback(null, uri);
				}
			});
		}
	},

	normalizeUri : function(uri) {
		//TODO: handle URIs with hash
		var parseUri = url.parse(uri,true);
		if(parseUri.protocol && (parseUri.protocol === 'http:' || parseUri.protocol === 'https:')){
			if(parseUri.host && (parseUri.host === 'twitter.com' || parseUri.host === 'www.twitter.com')){
				if(parseUri.pathname){
					var parts = parseUri.pathname.split("/");
					if (parts[2] === "status"){
						//1=> user; 3 => tweet id
						return "http://twitter.com/"+parts[1]+"/status/"+parts[3];
					}
				}
			}		
		}
		return null;
	}
};