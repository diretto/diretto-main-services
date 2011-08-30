/**
 * A helper object that parses resource URIs using the v2 URI templates.
 */
module.exports = function(baseUri) {

	var baseLength = baseUri.length;

	/**
	 * Returns the partial URI omitting the base URI and the first "/"
	 */
	var chopOfBaseUri = function(uri) {
		if (uri.length > baseLength && baseUri === uri.substring(0, baseLength)) {
			return uri.substr(baseLength + 1);
		}
		return null;
	};

	return {
		extractUserId : function(uri) {
			var partial = chopOfBaseUri(uri);
			if (partial) {
				var parts = partial.split("/");
				if (parts.length > 1 && parts[0] === 'user') {
					return {
						userId : parts[1]
					};
				}
			}
			return null;
		},
		extractDocumentId : function(uri) {
			var partial = chopOfBaseUri(uri);
			if (partial) {
				var parts = partial.split("/");
				if (parts.length > 1 && parts[0] === 'document') {
					return {
						documentId : parts[1]
					};
				}
			}
			return null;
		},
		extractBaseTagId : function(uri) {
			var partial = chopOfBaseUri(uri);
			if (partial) {
				var parts = partial.split("/");
				if (parts.length > 1 && parts[0] === 'tag') {
					return {
						baseTagId : parts[1]
					};
				}
			}
			return null;
		},
		
		generic : function(uri){
			var partial = chopOfBaseUri(uri);
			if (partial) {
				var results = {};
				var parts = partial.split("/");
				if (parts.length > 1 && parts[0] === 'document') {
					results['documentId'] = parts[1]; 
					if (parts.length > 3 && parts[2] === 'attachment') {
						results['attachmentId'] = parts[3]; 
					}
					else if (parts.length > 3 && parts[2] === 'tag') {
						results['tagId'] = parts[3]; 
					}
					else if (parts.length > 3 && parts[2] === 'comment') {
						results['commentId'] = parts[3]; 
					}
					else if (parts.length > 3 && parts[2] === 'tag') {
						results['tagId'] = parts[3]; 
					}
					else if (parts.length > 3 && parts[2] === 'time') {
						results['time'] = parts[3]; 
					}
					else if (parts.length > 3 && parts[2] === 'location') {
						results['location'] = parts[3]; 
					}
				}
				else if (parts.length > 1 && parts[0] === 'link') {
					results['linkId'] = parts[1]; 
				}
				else if (parts.length > 1 && parts[0] === 'tag') {
					results['baseTagId'] = parts[1]; 
				}
				
				return results;
			}
			return null;
			
		}
	}
};