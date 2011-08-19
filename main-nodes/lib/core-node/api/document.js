
module.exports = function(h) {
	
	var BATCH_LIMIT = h.options.core.parameters.batchLimit || 50;
	var PAGINATION_SIZE = h.options.core.parameters.paginationSize || 20;
	
	/*
	 * ------------------------------ Validation Functions --------------------------------
	 */
	
	var validateDocumentData = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400,"Invalid doucment. " + (msg || "Please check your entity structure."),response,next);
		};		
		
		if (!data || !data.email|| !data.password|| !data.username) {
			fail("Attributes are missing.");
			return;
		}
	};
	
	/*
	 * ------------------------------------------------------------------------------------
	 */

	var renderDocument = function(doc){
		return {};
	};

	return {

		create : function(req, res, next) {
			validateDocumentData(req.params, res, next, function(data){
				
			});
			res.send(501);
			return next();
		},
		getMetdata : function(req, res, next) {
			res.send(501);
			return next();
		},
		getSnapshot : function(req, res, next) {
			res.send(501);
			return next();
		},
		getFull : function(req, res, next) {
			res.send(501);
			return next();
		},
		batchFull : function(req, res, next) {
			res.send(501);
			return next();
		},
		batchSnapshot : function(req, res, next) {
			res.send(501);
			return next();
		},
		batchMetadata : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardDocuments : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardSince : function(req, res, next) {
			res.send(501);
			return next();
		},
		listDocuments : function(req, res, next) {
			res.send(501);
			return next();
		},
		forwardUserDocuments : function(req, res, next) {
			res.send(501);
			return next();
		},
		listUserDocuments : function(req, res, next) {
			res.send(501);
			return next();
		}
	};
};