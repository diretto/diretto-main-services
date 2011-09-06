module.exports = function(h) {

	return {

		getDocumentsFeed : function(req, res, next) {
			res.send(501);
			return next();
		},

		getAttachmentsFeed : function(req, res, next) {
			res.send(501);
			return next();
		},

		getCommentsFeed : function(req, res, next) {
			res.send(501);
			return next();
		},

		getMediaFeed : function(req, res, next) {
			res.send(501);
			return next();
		},

		getDocumentDetailsFeed : function(req, res, next) {
			res.send(501);
			return next();
		},

	};
};