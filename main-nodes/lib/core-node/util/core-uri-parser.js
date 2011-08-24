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
		}
	}
};