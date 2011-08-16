module.exports = function(h) {

	return {

		get : function(req, res, next) {
			res.send(501);
			return next();
		},
		unlock : function(req, res, next) {
			res.send(501);
			return next();
		},
		create : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardAttachments : function(req, res, next) {
			res.send(501);
			return next();
		},
		listAttachments : function(req, res, next) {
			res.send(501);
			return next();
		}

	};
};