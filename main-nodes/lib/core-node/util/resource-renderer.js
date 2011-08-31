module.exports = function(h) {
	return {
		renderBaseTag : function(doc) {
			return {
				"baseTag" : {
					"link" : h.util.link(h.util.uri.baseTag(doc.baseTagId)),
					"value" : doc.value,
					"creationTime" : doc.creationTime,
					"creator" : {
						"link" : h.util.link(h.util.uri.user(doc.creator))
					}
				}
			};
		}
	};
};