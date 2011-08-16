module.exports = function(h) {

	return {

		forwardSince : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardBox : function(req, res, next) {
			res.send(501);
			return next();
		},
		listBox : function(req, res, next) {
			res.send(501);
			return next();
		},
		send : function(req, res, next) {
			res.send(501);
			return next();
		},
		get : function(req, res, next) {
			res.send(501);
			return next();
		},
		remove : function(req, res, next) {
			res.send(501);
			return next();
		}
		

	};
};