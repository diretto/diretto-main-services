module.exports = function(h) {

	return {

		getAll : function(req, res, next) {
			res.send(501);
			return next();
		},
		get : function(req, res, next) {
			res.send(501);
			return next();
		},
		undo : function(req, res, next) {
			res.send(501);
			return next();
		},
		cast : function(req, res, next) {
			res.send(501);
			return next();
		}	

	};
};