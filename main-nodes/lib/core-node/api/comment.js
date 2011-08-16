module.exports = function(h) {

	return {
		get : function(req, res, next) {
			res.send(501);
			return next();
		},
		create : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardDocumentComments : function(req, res, next) {
			res.send(501);
			return next();
		},
		listDocumentComments : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardUserComments : function(req, res, next) {
			res.send(501);
			return next();
		},
		listUserComments : function(req, res, next) {
			res.send(501);
			return next();
		}

	};
};