/**
 * A template for external resource plugins.
 * 
 * 		validateUri(uri, [callback]) 
 * 			Validates the given URI and executes the callback with the parames (err, uri).
 * 			If the URI is valid, it is returned in a normalized representation.    
 * 
 * 		normalizeUri(uri) 
 * 			Returns a normalized URI of the given URI or null if invalid.
 *  
 * @author Benjamin Erb
 */

exports.template = {
	id : "",
	version : "",
	author : "",
	name : "",
	validateUri : function(uri, callback) {
	},
	normalizeUri : function(uri) {
	},
	init : function(options) {
	}
};