module.exports = function(h) {

	/*
	 * ------------------------------ Validation Functions
	 * --------------------------------
	 */
	var COL_TITLE_MIN_LENGTH = 3;
	var COL_TITLE_MAX_LENGTH = 128;

	var COL_DESC_MAX_LENGTH = 1024;

	/**
	 * Validates submitted link
	 */
	var validateCollectionData = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400, "Invalid collection values. " + (msg || "Please check your entity structure."), response, next);
		};

		if (!data || !data.title || !data.description) {
			fail("Attributes are missing.");
			return;
		}

		if ((typeof data.title !== "string") || (data.title.length < COL_TITLE_MIN_LENGTH) || (data.title.length > COL_TITLE_MAX_LENGTH)) {
			fail("Invalid title");
			return;
		}
		if ((typeof data.description !== "string") || (data.description.length > COL_DESC_MAX_LENGTH)) {
			fail("Invalid description");
			return;
		}

		if (data.nonpublic === undefined || !(typeof data.nonpublic === "boolean")) {
			fail("Invalid source link");
			return;
		}

		callback({
			title : data.title,
			description : data.description,
			nonpublic : data.nonpublic
		});
	};

	var validateAddDocData = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400, "Invalid document values. " + (msg || "Please check your entity structure."), response, next);
		};

		if (!data || !data.document) {
			fail("Attributes are missing.");
			return;
		}

		if (!data.document || !data.document.link || !data.document.link.href || !(typeof data.document.link.href === "string")) {
			fail("Invalid document link");
			return;
		}

		callback({
			document : {
				link : {
					rel : "self",
					href : data.document.link.href
				}
			}
		});
	};

	return {

		add : function(req, res, next) {
			validateAddDocData(req.params, res, next, function(data) {
				var doc = h.util.uriParser.extractDocumentId(data.document.link.href);
				if (doc === null) {
					h.responses.error(400, "Invald document URI.", res, next);
					return;
				}

				h.util.dbFetcher.exist(req.uriParams.collectionId, h.c.COLLECTION, function(code) {
					if (code === 200) {
						h.util.dbFetcher.viewKeyExists('docs/published_docs', doc.documentId, function(err, published) {
							if (err) {
								h.responses.error(500, "Internal server error.", res, next);
								return;
							}
							else if (!published) {
								h.responses.error(404, "Document (" + h.util.uri.document(doc.documentId) + ") not found.", res, next);
								return;
							}
							else {
								h.util.dbFetcher.viewKeyExists('docs/docs_by_collection', [ req.uriParams.userId, req.uriParams.collectionId, doc.documentId ], function(err, exsits) {
									if (err) {
										h.responses.error(500, "Internal server error.", res, next);
										return;
									}
									else if (exsits) {
										h.responses.error(409, "Document is already part of this collection.", res, next);
										return;
									}
									else {
										var docColDoc = {
											_id : h.c.COLLECTIONDOCUMENT.wrap(h.util.dbHelper.concat(req.uriParams.userId, req.uriParams.collectionId, doc.documentId)),
											type : h.c.COLLECTIONDOCUMENT.TYPE,
											collectionId : req.uriParams.collectionId,
											userId : req.uriParams.userId,
											documentId : doc.documentId
										};
										
										h.db.save(docColDoc._id, docColDoc, function(err) {
											if (err) {
												h.responses.error(500, "Internal server error.", res, next);
												return;
											}
											else {
												res.send(202, {
													"link" : h.util.link(h.util.uri.collectionDocument(req.authenticatedUser, req.uriParams.collectionId, doc.documentId))
												}, {
													'Location' : h.util.uri.collectionDocument(req.authenticatedUser, req.uriParams.collectionId, doc.documentId)
												});
												return next();
											}
										});
									}
								});
							}
						});
					}
					else if (code === 404) {
						h.responses.error(404, "Collection not found.", res, next);
						return;
					}
					else {
						h.responses.error(500, "Internal server error.", res, next);
						return;

					}
				});

			});
		},

		change : function(req, res, next) {
			validateCollectionData(req.params, res, next, function(data) {
				h.util.dbFetcher.fetch(req.uriParams.collectionId, h.c.COLLECTION, function(err, doc) {
					if (err && err === 404) {
						h.responses.error(404, "Collection not found.", res, next);
						return;
					}
					else if (!doc) {
						h.responses.error(500, "Internal server error.", res, next);
						return;
					}
					else {
						doc.title = data.title;
						doc.description = data.description;
						doc.nonpublic = data.nonpublic;

						h.db.save(doc._id, doc, function(err) {
							if (err) {
								h.responses.error(500, "Internal server error.", res, next);
								return;
							}
							else {
								res.send(202, {
									"link" : h.util.link(h.util.uri.collection(req.authenticatedUser, req.uriParams.collectionId))
								}, {
									'Location' : h.util.uri.collection(req.authenticatedUser, req.uriParams.collectionId)
								});
								return next();
							}
						});

					}
				});
			});
		},

		create : function(req, res, next) {
			validateCollectionData(req.params, res, next, function(data) {

				var colId = h.uuid();

				var colDoc = {
					_id : h.c.COLLECTION.wrap(colId),
					type : h.c.COLLECTION.TYPE,
					collectionId : colId,
					creator : req.authenticatedUser,
					creationTime : new Date().toRFC3339UTCString(),
					title : data.title,
					description : data.description,
					nonpublic : data.nonpublic
				};

				h.db.save(colDoc._id, colDoc, function(err) {
					if (err) {
						h.responses.error(500, "Internal server error.", res, next);
						return;
					}
					else {
						res.send(201, {
							"link" : h.util.link(h.util.uri.collection(req.authenticatedUser, colId))
						}, {
							'Location' : h.util.uri.collection(req.authenticatedUser, colId)
						});
						return next();
					}
				});

			});
		},

		remove : function(req, res, next) {
			res.send(501);
			return next();
		},

		get : function(req, res, next) {
			res.send(501);
			return next();
		},

		forwardCollectionDocs : function(req, res, next) {
			// TODO check if public or user === creator
			res.send(501);
			return next();
		},

		listCollectionDocs : function(req, res, next) {
			res.send(501);
			return next();
		},

		getUserCollections : function(req, res, next) {
			res.send(501);
			return next();
		}

	};
};