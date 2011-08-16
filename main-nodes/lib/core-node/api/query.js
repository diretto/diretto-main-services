module.exports = function(h) {

	return {

		create : function(req, res, next) {
			res.send(501);
			return next();
		},
		forward : function(req, res, next) {
			res.send(501);
			return next();
		},
		resultPage : function(req, res, next) {
			res.send(501);
			return next();
		}
		
		

	};
};