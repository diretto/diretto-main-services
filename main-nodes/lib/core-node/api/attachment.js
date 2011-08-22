module.exports = function(h) {

	return {
		
		create : function(req, res, next) {
			res.send(501);
			return next();
		},
		
		get : function(req, res, next) {
			res.send(501);
			return next();
		},
		unlock : function(req, res, next) {
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