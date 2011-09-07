module.exports = function(h) {

	return {
		
		getByBbox : function(req, res, next) {
			res.send(501);
			return next();
		},

		getDocuments : function(req, res, next) {
			res.send(501);
			return next();
		},

		getDocumentPositions : function(req, res, next) {
			res.send(501);
			return next();
		}

	};
};
