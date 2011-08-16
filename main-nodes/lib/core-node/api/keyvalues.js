module.exports = function(h) {

	return {

		get : function(req, res, next) {
			res.send(501);
			return next();
		},
		remove : function(req, res, next) {
			res.send(501);
			return next();
		},
		put : function(req, res, next) {
			res.send(501);
			return next();
		},
		getAll : function(req, res, next) {
			res.send(501);
			return next();
		}	

	};
};