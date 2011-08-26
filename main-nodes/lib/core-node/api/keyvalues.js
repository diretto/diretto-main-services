module.exports = function(h) {
	
	var MIN_KEY_LENGTH = 3;
	var MAX_KEY_LENGTH = 64;
	var KEY_REGEXP = /^([a-zA-Z0-9\-:_\.])$/;
	
	var MAX_VALUE_LENGTH = h.options.core.parameters.maxValueLength || 1024;


	var validateKeyValueData  = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400, "Invalid key/value. " + (msg || "Please check your entity structure."), response, next);
		};

		if (!data || !data.value) {
			fail("Attributes are missing.");
			return;
		}
		
		if (typeof data.value !== "string") {
			fail("Invalid value, only strings allowed.");
			return;
		}

		if (data.value.length > MAX_VALUE_LENGTH) {
			fail("Value is too long, maximal character length is "+MAX_VALUE_LENGTH+".");
			return;
		}
		
		callback({
			value : data.value
		});
	};
	
	var checkKeyName = function(keyField){
		return ((keyField.length < MIN_KEY_LENGTH) || (keyField.length > MAX_KEY_LENGTH) || (!KEY_REGEXP.test(keyField)))
	};
	
	
	
	var renderKeyValue = function(doc){
		return {
			link : h.util.link(h.util.uri.keyvalue(doc.documentId, doc.userId, doc.key)),
			key : {
				namespace : doc.userId,
				field : doc.key
			},
			value : doc.value
		};
	};
	
	return {

		get : function(req, res, next) {
			h.util.dbFetcher.viewKeyExists('docs/published_docs', req.uriParams.documentId, function(err, published) {
				if (err) {
					h.responses.error(500, "Internal server error.", res, next);
					return;
				}
				else if (!published) {
					h.responses.error(404, "Document (" + h.util.uri.document(req.uriParams.documentId) + ") not found.", res, next);
					return;
				}
				else {
					
					var key = req.uriParams.key;
					var userId = req.authenticatedUser;
					var documentId = req.uriParams.documentId;
					
					var id = h.util.dbHelper.concat(userId, documentId, key);						
					
					h.util.dbFetcher.fetch(id, h.c.KEYVALUE, function(err, doc) {
						if (err && err === 404) {
							h.responses.error(404, "Key/value not found.", res, next);
							return;
						}
						else if (!doc) {
							h.responses.error(500, "Internal server error.", res, next);
							return;
						}
						else {
							res.send(200, renderKeyValue(doc));
							return next();
						}
					});
				}
			});
		},
		
		remove : function(req, res, next) {
			h.util.dbFetcher.viewKeyExists('docs/published_docs', req.uriParams.documentId, function(err, published) {
				if (err) {
					h.responses.error(500, "Internal server error.", res, next);
					return;
				}
				else if (!published) {
					h.responses.error(404, "Document (" + h.util.uri.document(req.uriParams.documentId) + ") not found.", res, next);
					return;
				}
				else {
					
					var key = req.uriParams.key;
					var userId = req.authenticatedUser;
					var documentId = req.uriParams.documentId;
					
					var id = h.util.dbHelper.concat(userId, documentId, key);						
					
					h.util.dbFetcher.fetch(id, h.c.KEYVALUE, function(err, doc) {
						if (err && err === 404) {
							h.responses.error(404, "Key/value not found.", res, next);
							return;
						}
						else if (!doc) {
							h.responses.error(500, "Internal server error.", res, next);
							return;
						}
						else {
							h.db.remove(doc._id, doc._rev, function(err) {
								if (err) {
									h.responses.error(500, "Internal server error.", res, next);
									return;
								}
								else {
									res.send(204);
									return next();
								}
							});
						}
					});
				}
			});
		},
		
		put : function(req, res, next) {
			
			if(checkKeyName(req.uriParams.key) !== true){
				h.responses.error(400, "Invalid key.", res, next);
				return;
			}
			
			validateKeyValueData(req.params, res, next, function(data) {

				//check if document exists
				h.util.dbFetcher.viewKeyExists('docs/published_docs', req.uriParams.documentId, function(err, published) {
					if (err) {
						h.responses.error(500, "Internal server error.", res, next);
						return;
					}
					else if (!published) {
						h.responses.error(404, "Document (" + h.util.uri.document(req.uriParams.documentId) + ") not found.", res, next);
						return;
					}
					else {
						
						var key = req.uriParams.key;
						var userId = req.authenticatedUser;
						var documentId = req.uriParams.documentId;
						
						var id = h.util.dbHelper.concat(userId, documentId, key);						
						
						h.util.dbFetcher.fetch(id, h.c.KEYVALUE, function(err, doc) {
							var kvDoc;
							if (err && err === 404) {
								kvDoc = {
										_id : h.c.KEYVALUE.wrap(id),
										type : h.c.KEYVALUE.TYPE,
										key : key,
										userId  : userId,
										documentId : documentId
								};
							}
							else if (!doc) {
								h.responses.error(500, "Internal server error.", res, next);
								return;
							}
							else {
								kvDoc = doc; 
							}
							
							kvDoc.value = data.value;
							
							console.dir(kvDoc);
							
							h.db.save(kvDoc._id, kvDoc, function(err) {
								if (err) {
									h.responses.error(500, "Internal server error.", res, next);
									return;
								}
								else {
									res.send(202, {
										"link" : h.util.link(h.util.uri.keyvalue(documentId, userId, key))
									}, {
										'Location' : h.util.uri.keyvalue(documentId, userId, key)
									});
									return next();
								}
							});
						});
					}
				});
			});
		},
		
		getAll : function(req, res, next) {
			h.util.dbFetcher.viewKeyExists('docs/published_docs', req.uriParams.documentId, function(err, published) {
				if (err) {
					h.responses.error(500, "Internal server error.", res, next);
					return;
				}
				else if (!published) {
					h.responses.error(404, "Document (" + h.util.uri.document(req.uriParams.documentId) + ") not found.", res, next);
					return;
				}
				else {
					
					var documentId = req.uriParams.documentId;
					
					var range = [documentId];
					
					h.util.dbPaginator.getPage('docs/keyvalues_by_doc', range, range, 2048, false, true, function(row){
						return {
							doc : row.doc
						};
					}, function(err, result){
						if(err){
							res.send(500);
						}
						else{
							
							var list = result.list.map(function(row){
								return renderKeyValue(row.doc);
							});
							
							res.send(200, {
								values : {
									link : h.util.link(h.util.uri.document()+"/values"),
									list : list
								}
							});
							return next();
						}
					});
				}
			});
		}	

	};
};