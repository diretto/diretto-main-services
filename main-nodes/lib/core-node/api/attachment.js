module.exports = function(h) {

	return {

		create : function(req, res, next) {

			h.util.commonValidator.validateAttachmentData(req.params, res, next, function(data) {
				console.dir(data);

				var stored = true;
				if (data.external) {
					stored = false;
				}

				var docId = req.uriParams.documentId;

				var attachmentId = h.uuid();

				var contributors = h.util.commonValidator.flattenPersonList(data.contributors);
				var creators = h.util.commonValidator.flattenPersonList(data.creators);

				var attachmentDoc = {
					_id : h.c.ATTACHMENT.wrap(h.util.dbHelper.concat(docId, attachmentId)),
					type : h.c.ATTACHMENT.TYPE,
					attachmentId : attachmentId,
					documentId : docId,
					publisher : req.authenticatedUser,
					publishedTime : new Date().toRFC3339UTCString(),
					mimeType : data.mimeType,
					title : data.title,
					description : data.description,
					license : data.license,
					contributors : contributors,
					creators : creators
				};
				if (stored) {
					attachmentDoc.fileSize = data.fileSize;
					attachmentDoc.enabled = false;
				}
				else {
					attachmentDoc.external = data.external;
					attachmentDoc.enabled = true;
				}

				var createAttachment = function(callback) {
					h.db.save(attachmentDoc._id, attachmentDoc, function(err) {
						if (err) {
							h.responses.error(500, "Internal server error. Please try again later.", res, next);
						}
						else {
							callback();
						}
					});
				};

				//check if document exists					
				h.db.head(h.c.DOCUMENT.wrap(docId), function(err, headers, code) {
					if (code && code === 404) {
						h.responses.error(404, "Document not found.", res, next);
						return;
					}
					else if (code && code === 200) {

						//if to be stored on the storage service, create token
						if (stored) {
							if (!(data.mimeType in h.options.mediatypes.stored)) {
								h.responses.error(400, "Unsupported media type for storing attachment. Please check the media type resource for allowed types.", res, next);
								return;
							}
							if (data.fileSize > h.options.mediatypes.stored[data.mimeType].maxSize) {
								h.responses.error(400, "File entity is too large. The maximum file size allowed for this content type is " + h.options.mediatypes.stored[data.mimeType].maxSize + ".",
										res, next);
								return;
							}

							var path = "/" + docId + "/" + attachmentId + "." + h.options.mediatypes.stored[data.mimeType].extension;

							//calculate token
							/* username, path, length, mimetype, callback */
							var token = h.signer.signRequest(req.authenticatedUser, path, data.fileSize, data.mimeType, function(err, token) {
								if (err) {
									h.responses.error(500, "Internal server error. Please try again later.", res, next);
									return;
								}
								createAttachment(function() {
									res.send(202, {
										"link" : h.util.link(h.util.uri.attachment(docId, attachmentId)),
										"upload" : {
											"token" : token,
											"location" : {
												"link" : h.util.link(h.options.common.endpoints.storage + path)
											},
											"target" : {
												"link" : h.util.link(h.options.common.endpoints.storage + path + "?token=" + token)
											}
										}
									}, {
										'Location' : h.util.uri.attachment(docId, attachmentId)
									});
									return next();
								});
							});

						}
						else {
							if (!(data.mimeType in h.options.mediatypes.external)) {
								h.responses.error(400, "Unsupported media type for external entries. Please check the media type resource for allowed types.", res, next);
								return;
							}

							//validate external URI using the content provider plugin
							h.options.mediatypes.external[data.mimeType].validateUri(data.external, function(err, uri) {
								if (err) {
									h.responses.error(400, "Invalid external type. The URI has been rejected. Please check the URI again.", res, next);
								}
								else {
									attachmentDoc.external = uri;
									createAttachment(function() {
										res.send(201, {
											"link" : h.util.link(h.util.uri.attachment(docId, attachmentId))
										}, {
											'Location' : h.util.uri.attachment(docId, attachmentId)
										});
										return next();
									});
								}
							});
						}
					}
					else {
						console.dir(code);
						h.responses.error(500, "Internal server error. Please try again later.", res, next);
						return;
					}
				});
			});
		},
		
		unlock : function(req, res, next) {

			var documentId = req.uriParams.documentId;
			var attachmentId = req.uriParams.attachmentId;

			h.util.dbFetcher.fetch(h.util.dbHelper.concat(documentId, attachmentId), h.c.ATTACHMENT, function(err, doc) {
				if (err && err === 404) {
					h.responses.error(404, "Document / Attachment not found.", res, next);
					return;

				}
				else if (err) {
					h.responses.error(500, "Internal server error. Please try again later.", res, next);
					return;
				}
				else if (doc && doc.enabled === true) {
					res.send(410);
					return next();
				}
				else {
					if (!req.params.token) {
						h.responses.error(400, "Missing token.", res, next);
						return;
					}

					var token = req.params.token;

					var path = "/" + documentId + "/" + attachmentId + "." + h.options.mediatypes.stored[doc.mimeType].extension;

					h.signer.signResponse(201, req.authenticatedUser, path, function(err, expectedToken) {
						console.log(token);
						console.log(expectedToken);
						if (err) {
							h.responses.error(500, "Internal server error. Please try again later.", res, next);
							return;
						}
						else if (expectedToken !== token) {
							h.responses.error(403, "Invalid lock.", res, next);
							return;
						}
						else {

							doc.enabled = true;
							h.db.save(doc._id, doc, function(err) {
								if (err) {
									h.responses.error(500, "Internal server error.", res, next);
									return;
								}
								else {
									res.send(204);
									return next();
								}
							});

							if (documentId === attachmentId) {
								h.util.dbFetcher.fetch(documentId, h.c.DOCUMENT, function(err, doc) {
									if (!err) {
										doc.enabled = true;
										h.db.save(doc._id, doc, function(err) {
										});
									}
								});
							}
						}
					});
				}
			});
		},

		forwardAttachment : function(req, res, next) {

			var documentId = req.uriParams.documentId;
			var attachmentId = req.uriParams.attachmentId;

			h.util.dbFetcher.fetch(h.util.dbHelper.concat(documentId, attachmentId), h.c.ATTACHMENT, function(err, doc) {
				if (err && err === 404) {
					h.responses.error(404, "Document / Attachment not found.", res, next);
					return;

				}
				else if (err) {
					h.responses.error(500, "Internal server error. Please try again later.", res, next);
					return;

				}
				else if (doc && doc.enabled !== true) {
					res.send(204);
					return next();
				}
				else {
					if (doc.external) {
						res.send(301, null, {
							'Location' : doc.external
						});
					}
					else {
						var path = "/" + documentId + "/" + attachmentId + "." + h.options.mediatypes.stored[doc.mimeType].extension;
						res.send(301, null, {
							'Location' : h.options.common.endpoints.storage + path
						});

					}
					return next();
				}
			});

		},
		

		get : function(req, res, next) {
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId, "attachment", req.uriParams.attachmentId],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					h.responses.error(404,"Attachment not found.",res,next);
				}
				else{
					res.send(200, h.util.renderer.attachment(result[req.uriParams.documentId]["attachment"][req.uriParams.attachmentId]));
					return next();
				}
			});
		},
		
		
		listAttachments : function(req, res, next) {
			console.log("bla");
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId, "attachment"],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					//empty result, so check if document exists at all
					h.util.dbFetcher.exist(req.uriParams.documentId, h.c.DOCUMENT, function(code){
						if(code === 200){
							res.send(200, h.util.renderer.attachmentList(req.uriParams.documentId,{}));
							return next();
						}
						else if(code === 404){
							h.responses.error(404,"Document not found.",res,next);
						}
						else{
							h.responses.error(500,"Internal server error.",res,next);
						}
					});
				}
				else{
					res.send(200, h.util.renderer.attachmentList(req.uriParams.documentId,result[req.uriParams.documentId]["attachment"]));
					return next();
				}
			});
		}

	};
};