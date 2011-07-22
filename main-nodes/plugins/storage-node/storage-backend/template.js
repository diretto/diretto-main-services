/**
 * A template for media backend storage.
 * 
 * 	get events:	not_found, cache_hit, meta_data, stream, error	 
 * 
 *  
 * @author Benjamin Erb
 */

exports.template = {
	id : "",
	version : "",
	author : "",
	name : "",

	init : function(options) {
	},
	
	get : function(documentId, attachmentId, extension, etag, isHeadRequest) {
	},

	put : function(documentId, attachmentId, extension, mimeType, size, readableStream) {
	}

//	remove : function(documentId, attachmentId, callback) {
//	}
};