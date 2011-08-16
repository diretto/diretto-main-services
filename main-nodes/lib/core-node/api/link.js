module.exports = function(h) {

	return {

		create : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardLinks : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardSince : function(req, res, next) {
			res.send(501);
			return next();
		},
		listLinks : function(req, res, next) {
			res.send(501);
			return next();
		},
		get : function(req, res, next) {
			res.send(501);
			return next();
		},
		getDocumentLinks : function(req, res, next) {
			res.send(501);
			return next();
		}

	};
};