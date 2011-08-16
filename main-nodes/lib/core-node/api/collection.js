module.exports = function(h) {

	return {

		add : function(req, res, next) {
			res.send(501);
			return next();
		},

		change : function(req, res, next) {
			res.send(501);
			return next();
		},

		create : function(req, res, next) {
			res.send(501);
			return next();
		},

		remove : function(req, res, next) {
			res.send(501);
			return next();
		},

		get : function(req, res, next) {
			res.send(501);
			return next();
		},

		forwardCollectionDocs : function(req, res, next) {
			res.send(501);
			return next();
		},

		listCollectionDocs : function(req, res, next) {
			res.send(501);
			return next();
		},

		getUserCollections : function(req, res, next) {
			res.send(501);
			return next();
		}

	};
};