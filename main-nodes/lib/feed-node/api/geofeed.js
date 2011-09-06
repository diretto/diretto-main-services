module.exports = function(h) {

	return {
		

		get : function(req, res, next) {
			res.send(501);
			return next();
		}

	};
};
