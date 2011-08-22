require("rfc3339date");
var barrierpoints = require('barrierpoints');


module.exports = function(h) {
	
	var BATCH_LIMIT = h.options.core.parameters.batchLimit || 50;
	var PAGINATION_SIZE = h.options.core.parameters.paginationSize || 20;
	
	/*
	 * ------------------------------ Validation Functions --------------------------------
	 */
	

	
	/*
	 * ------------------------------------------------------------------------------------
	 */

	var renderDocument = function(doc){
		
		
		return {};
	};

	return {

		create : function(req, res, next) {
			if(!h.util.commonValidator.validateUUID(req.uriParams.documentId)){
				h.responses.error(400,"Invalid document id. Please use a UUID.",res,next);
				return;
			}
				
			h.util.commonValidator.validateDocumentData(req.params, res, next, function(data){
				//check if stored or external
				var stored = true;
				if(data.external){
					stored = false;
				}
				
				var docId = req.uriParams.documentId;

				
				var saveDocument = function(callback){
					var documentDoc = {
							_id : h.c.DOCUMENT.wrap(docId),
							type : h.c.DOCUMENT.TYPE,
							publisher : req.authenticatedUser,
							publishedTime : new Date().toRFC3339UTCString(),
							mediaType : data.mimeType.split("/")[0],
							title : data.title,
							description: data.description,
							enabled : false
					};
					
					h.db.save(documentDoc._id, documentDoc, callback);
				};
				
				var saveAttachment = function(callback){
					var attachmentDoc = {
							_id : h.c.ATTACHMENT.wrap(h.util.dbHelper.concat(docId,docId)),
							type : h.c.ATTACHMENT.TYPE,
							attachmentId : docId,
							documentId : docId,
							publisher : req.authenticatedUser,
							publishedTime : new Date().toRFC3339UTCString(),
							mimeType : data.mimeType,
							title : data.title,
							description: data.description,
							license : data.license,
					};
					if(stored){
						attachmentDoc.fileSize = data.fileSize;
						attachmentDoc.uploaded = false;
					}
					else{
						attachmentDoc.external = data.external;
					}	
					
					h.db.save(attachmentDoc._id, attachmentDoc, callback);

				};
				
				var saveLocation = function(callback){
					var locationDoc = {
							_id : h.c.LOCATION.wrap(h.util.dbHelper.concat(docId, h.util.dbHelper.createLocationId(data.location.position.coordinates[1], data.location.position.coordinates[0], data.location.variance))),
							type : h.c.LOCATION.TYPE,
							documentId : docId,
							creator : req.authenticatedUser,
							creationTime : new Date().toRFC3339UTCString(),
							lat : data.location.position.coordinates[1],
							lon : data.location.position.coordinates[0],
							variance : data.location.variance 
					};
					h.db.save(locationDoc._id, locationDoc, callback);
				};
				
				var saveTime = function(callback){
					var timeDoc = {
							_id : h.c.TIME.wrap(h.util.dbHelper.concat(docId, h.util.dbHelper.createTimeId(data.createdBetween.before, data.createdBetween.after))),
							type : h.c.TIME.TYPE,
							documentId : docId,
							creator : req.authenticatedUser,
							creationTime : new Date().toRFC3339UTCString(),
							before : data.createdBetween.before,
							after : data.createdBetween.after,
					};
					
					h.db.save(timeDoc._id, timeDoc, callback);
				};
				
				var createDocumentDocs = function(callback){
					//check if document exists					
					h.db.head(h.c.DOCUMENT.wrap(docId), function(err, headers,code) {
						if(code && code === 404){
							
							var b = barrierpoints(4, callback, function(){
								h.responses.error(500,"Internal server error. Please try again later.",res,next);
							});
							
							var docSavedCallback = function(err){
								if(err){
									b.abort();
								}
								else{
									b.submit();
								}
							};
							
							saveDocument(docSavedCallback);
							saveAttachment(docSavedCallback);
							saveTime(docSavedCallback);
							saveLocation(docSavedCallback);
						}
						else if(code && code === 200){
							h.responses.error(409,"Document already exists.",res,next);
							console.log("Hji");
							return;
						}
						else {
							console.dir(code);
							h.responses.error(500,"Internal server error. Please try again later.",res,next);
							return;
						}
					});
					
				};
				console.dir(h.options.mediatypes.stored['text/plain']);

				
				if(stored){
					if(!(data.mimeType in h.options.mediatypes.stored)){
						h.responses.error(400,"Unsupported media type for storing attachment. Please check the media type resource for allowed types.",res,next);
						return;
					}
					if(data.fileSize > h.options.mediatypes.stored[data.mimeType].maxSize){
						h.responses.error(400,"File entity is too large. The maximum file size allowed for this content type is "+h.options.mediatypes.stored[data.mimeType].maxSize+".",res,next);
						return;
					}

					var path = "/"+docId+"/"+docId+"."+h.options.mediatypes.stored[data.mimeType].extension;

					//calculate token
					/* username, path, length, mimetype, callback */
					var token = h.signer.signRequest(req.authenticatedUser, path, data.fileSize,h.options.mediatypes.stored[data.mimeType], function(err, token){
							if(err){
								h.responses.error(500,"Internal server error. Please try again later.",res,next);
								return;
							}
							createDocumentDocs(function(){
								res.send(202, {
									"link" : h.util.link(h.util.uri.document(docId)),
									   "upload":{
										      "token":token,
										      "location":{
										         "link": h.util.link(h.options.common.endpoints.storage + path)
										      },
										      "target":{
										         "link":h.util.link(h.options.common.endpoints.storage + path+ "?token=" + token)
										      }
										   }
										}, {
									'Location' : h.util.uri.document(docId)
								});
								return next();
							});
					});
					
				}
				else{
					if(!(data.mimeType in h.options.mediatypes.external)){
						h.responses.error(400,"Unsupported media type for external entries. Please check the media type resource for allowed types.",res,next);
						return;
					}
					createDocumentDocs(function(){
						res.send(201, {
							"link" : h.util.link(h.util.uri.document(docId))
						}, {
							'Location' : h.util.uri.document(docId)
						});
						return next();
					});
					console.log(h.options.mediatypes.external[data.mimeType]);
				}
			});
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