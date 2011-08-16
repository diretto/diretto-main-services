module.exports = function(h) {

	return {

		create : function(req, res, next) {
			res.send(501);
			return next();
		},
		getMetdata : function(req, res, next) {
			res.send(501);
			return next();
		},
		getSnapshot : function(req, res, next) {
			res.send(501);
			return next();
		},
		getFull : function(req, res, next) {
			res.send(501);
			return next();
		},
		batchFull : function(req, res, next) {
			res.send(501);
			return next();
		},
		batchSnapshot : function(req, res, next) {
			res.send(501);
			return next();
		},
		batchMetadata : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardDocuments : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardSince : function(req, res, next) {
			res.send(501);
			return next();
		},
		listDocuments : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardUserDocuments : function(req, res, next) {
			res.send(501);
			return next();
		},
		listUserDocuments : function(req, res, next) {
			res.send(501);
			return next();
		}
	};
};