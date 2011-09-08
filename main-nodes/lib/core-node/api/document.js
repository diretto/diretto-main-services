require("rfc3339date");
var barrierpoints = require('barrierpoints');


module.exports = function(h) {
	
	var BATCH_LIMIT = h.options.core.parameters.batchLimit || 50;
	var PAGINATION_SIZE = h.options.core.parameters.paginationSize || 20;
	
	/*
	 * ------------------------------ Validation Functions --------------------------------
	 */
	
	var validateDocumentList = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400,"Invalid batch request. " + (msg || "Please check your entity structure."),response,next);
		};		
		
		if (data  === undefined || data.documents  === undefined || data.documents.length  === undefined || data.documents.length < 1) {
			fail("No documents in list.");
			return;
		}
		
		var entries = {};
		
		var validIds = [];
		var invalidUris = [];
		
		data.documents.forEach(function(docUri) {
			
			var parsedUri = h.util.uriParser.extractDocumentId(docUri);
			if(parsedUri){
				validIds.push(parsedUri.documentId);
			}
			else{
				invalidUris.push(docUri)
			}
		});
		
		//check for max snapshots allowed
		if(validIds.length > BATCH_LIMIT){
			fail("Too many items to fetch. Try again with a maximum of "+BATCH_LIMIT+" items.");
			return;
		}		
		//check for max snapshots allowed
		if(validIds.length ===0){
			fail("No valid items listed.");
			return;
		}			
		
		callback(invalidUris, validIds);

	};
	
	/*
	 * ------------------------------------------------------------------------------------
	 */


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
				
				var contributors = h.util.commonValidator.flattenPersonList(data.contributors);
				var creators = h.util.commonValidator.flattenPersonList(data.creators);

				var documentDoc = {
						_id : h.c.DOCUMENT.wrap(docId),
						type : h.c.DOCUMENT.TYPE,
						documentId : docId,
						publisher : req.authenticatedUser,
						publishedTime : new Date().toRFC3339UTCString(),
						mediaType : data.mimeType.split("/")[0],
						title : data.title,
						description: data.description,
						enabled : false
				};
				//when no upload is necessary, make document available
				if(!stored){
					documentDoc.enabled = true;
				}
				
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
						contributors : contributors,
						creators  :creators
				};
				if(stored){
					attachmentDoc.fileSize = data.fileSize;
					attachmentDoc.enabled = false;
				}
				else{
					attachmentDoc.external = data.external;
					attachmentDoc.enabled = true;
				}
				
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
				
				var timeDoc = {
						_id : h.c.TIME.wrap(h.util.dbHelper.concat(docId, h.util.dbHelper.createTimeId(data.createdBetween.before, data.createdBetween.after))),
						type : h.c.TIME.TYPE,
						documentId : docId,
						creator : req.authenticatedUser,
						creationTime : new Date().toRFC3339UTCString(),
						before : data.createdBetween.before,
						after : data.createdBetween.after,
				};
				
				var snapshotDoc = {
						_id : h.c.SNAPSHOT.wrap(docId),
						type : h.c.SNAPSHOT.TYPE,
						documentId : docId,
						mediaType : data.mimeType.split("/")[0],
						creator : req.authenticatedUser,
						creationTime : new Date().toRFC3339UTCString(),
						title : data.title,
						description: data.description,
						tags : [],
						time : {
							id : h.c.TIME.wrap(h.util.dbHelper.concat(docId, h.util.dbHelper.createTimeId(data.createdBetween.before, data.createdBetween.after))),
							before : data.createdBetween.before,
							after : data.createdBetween.after
						},
						location : {
							id : h.c.LOCATION.wrap(h.util.dbHelper.concat(docId, h.util.dbHelper.createLocationId(data.location.position.coordinates[1], data.location.position.coordinates[0], data.location.variance))),
							lat : data.location.position.coordinates[1],
							lon : data.location.position.coordinates[0],
							variance : data.location.variance 
						},
						enabled : (stored ? false : true)
				};
				
				var saveDocument = function(callback){					
					h.db.save(documentDoc._id, documentDoc, callback);
				};
				
				var saveAttachment = function(callback){
					h.db.save(attachmentDoc._id, attachmentDoc, callback);
				};
				
				var saveLocation = function(callback){					
					h.db.save(locationDoc._id, locationDoc, callback);
				};
				
				var saveTime = function(callback){						
					h.db.save(timeDoc._id, timeDoc, callback);
				};
				
				var saveSnapshot = function(callback){					
					h.db.save(snapshotDoc._id, snapshotDoc, callback);
				}
				
				var createDocumentDocs = function(callback){
					//check if document exists					
					h.db.head(h.c.DOCUMENT.wrap(docId), function(err, headers,code) {
						if(code && code === 404){
							
							var b = barrierpoints(5, callback, function(){
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
							saveSnapshot(docSavedCallback);
						}
						else if(code && code === 200){
							h.responses.error(409,"Document already exists.",res,next);
							return;
						}
						else {
							h.responses.error(500,"Internal server error. Please try again later.",res,next);
							return;
						}
					});
					
				};
				
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
					var token = h.signer.signRequest(req.authenticatedUser, path, data.fileSize,data.mimeType, function(err, token){
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
					h.options.mediatypes.external[data.mimeType].validateUri(data.external, function(err, uri){
						if(err){
							h.responses.error(400,"Invalid external type. The URI has been rejected. Please check the URI again.",res,next);
						}
						else{
							attachmentDoc.external = uri;

							documentDoc.enabled = true;
							attachmentDoc.enabled = true;
							snapshotDoc.enabled = true;
							
							createDocumentDocs(function(){
								res.send(201, {
									"link" : h.util.link(h.util.uri.document(docId))
								}, {
									'Location' : h.util.uri.document(docId)
								});
								return next();
							});
						}
					});
				}
			});
		},
		
		forwardDocuments : function(req, res, next) {
			h.util.dbPaginator.forward("docs/docs_by_date",[],function(row){
				return row.key[1];
			},function(err,cursor){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					var uri = h.util.uri.documentListPage(cursor); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});	
		},
		
		forwardSince : function(req, res, next) {
			h.util.dbPaginator.forwardSince("docs/docs_by_date",req.uriParams.since,[],function(row){
				return row.key[1];
			},function(err,cursor){
				if(err){
					
					h.responses.error(500,((err.error && err.error.reason) ? err.error.reason : "Internal server error."),res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					var uri = h.util.uri.documentListPage(cursor); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		listDocuments : function(req, res, next) {
			
			h.util.dbFetcher.fetch(req.uriParams.cursorId, h.c.DOCUMENT, function(err,doc){
				if(err && err === 404){
					h.responses.error(404,"Cursor not found.",res,next);
					return;
				}
				else if(err){
					h.responses.error(500,"Internal server error.",res,next);
					return;
				}
				else{
					var key = [doc.publishedTime, req.uriParams.cursorId];
					var range = [];
					
					var pageLink = h.util.uri.documentListPage;
					
					h.util.dbPaginator.getPage('docs/docs_by_date', key, range, PAGINATION_SIZE, false, false, function(row){
						return {
							key : row.key[1]
						};
					}, function(err, result){
						if(err){
							res.send(500);
						}
						else{
							
							var list = result.list.map(function(doc){
								return {
									document: {
										link : h.util.link(h.util.uri.document(doc.key))
									}
								};
							});
							
							var related = [];
							["next", "previous"].forEach(function(e){
								if(result[e]){
									related.push({
										"link" : h.util.link(pageLink(result[e].key), e)
									});
								}
							});
							
							var headers = {};
							if(result.etag){
								headers["Etag"] = '"'+result.etag+'"';
							}
							
							res.send(200, {
								"page" : {
									"link" : h.util.link(pageLink(req.uriParams.cursorId))
								},
								"list" :  list,
								"related" : related
							},headers);
							return next();
						}
					});
				}
			});
			
		},
		
		forwardUserDocuments : function(req, res, next) {
			
			h.util.dbPaginator.forward("docs/docs_by_user",[req.uriParams.userId],function(row){
				return row.key[2];
			},function(err,cursor){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					var uri = h.util.uri.userDocumentPage(req.uriParams.userId,cursor); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		listUserDocuments : function(req, res, next) {
			
			h.util.dbFetcher.fetch(req.uriParams.cursorId, h.c.DOCUMENT, function(err,doc){
				if(err && err === 404){
					h.responses.error(404,"Cursor not found.",res,next);
					return;
				}
				else if(err){
					h.responses.error(500,"Internal server error.",res,next);
					return;
				}
				else{
					var key = [req.uriParams.userId, doc.publishedTime, req.uriParams.cursorId];
					var range = [];
					
					var pageLink = h.util.uri.userDocumentPage;
					
					h.util.dbPaginator.getPage('docs/docs_by_user', key, range, PAGINATION_SIZE, false, false, function(row){
						return {
							key : row.key[2]
						};
					}, function(err, result){
						if(err){
							res.send(500);
						}
						else{
							
							var list = result.list.map(function(doc){
								return {
									document: {
										link : h.util.link(h.util.uri.document(req.uriParams.userId,doc.key))
									}
								};
							});
							
							var related = [];
							["next", "previous"].forEach(function(e){
								if(result[e]){
									related.push({
										"link" : h.util.link(pageLink(req.uriParams.userId,result[e].key), e)
									});
								}
							});
							
							var headers = {};
							if(result.etag){
								headers["Etag"] = '"'+result.etag+'"';
							}
							
							res.send(200, {
								"page" : {
									"link" : h.util.link(pageLink(req.uriParams.userId, req.uriParams.cursorId))
								},
								"list" :  list,
								"related" : related
							},headers);
							return next();
						}
					});
				}
			});
			
		},
		
		getMetdata : function(req, res, next) {
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId,"document",req.uriParams.documentId],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					h.responses.error(404,"Document not found.",res,next);
				}
				else{
					res.send(200, h.util.renderer.documentMeta(result[req.uriParams.documentId]));
					return next();
				}
			});
		},
		
		getFull : function(req, res, next) {
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					h.responses.error(404,"Document not found.",res,next);
				}
				else{
					
					//fetch link documents, if available
					var linkList = [];
					if(result[req.uriParams.documentId]["link"]){
						for(var idx in result[req.uriParams.documentId]["link"]){
							linkList.push(idx);
						}
					}
					
					h.util.dbFetcher.fetchMultipleLinksById(linkList,function(err, linkFetchResult){
						if(err){
							h.responses.error(500,"Internal server error.",res,next);
						}
						else{							
							res.send(200, h.util.renderer.documentFull(result[req.uriParams.documentId],linkFetchResult));
							return next();
						}
					});
				}
			});
		},
		
		
		batchFull : function(req, res, next) {
			validateDocumentList(req.params, res,next, function(invalidUris, docList){
				
				h.util.dbFetcher.fetchMultipleDocsById(docList,function(err, fetchResult){
					if(err){
						h.responses.error(500,"Internal server error.",res,next);
					}
					else{
						
						var results = {};
						var linkSet = {};
						
						//append invalid uris
						invalidUris.forEach(function(uri){
							results[uri] = {
									error : {
										reason : "Invalid URI"
									}
							}
						});
						docList.forEach(function(docId){
					    	if(!(fetchResult[docId] === null || fetchResult[docId]["document"] === null|| fetchResult[docId]["document"][docId] === null)){
						    	if(fetchResult[docId]["link"]){
									for(var idx in fetchResult[docId]["link"]){
										linkSet[idx] = true;
									}
								}
						    }
						});
						
						var linkList = [];
						for(var idx in linkSet){
							if(linkSet.hasOwnProperty(idx)){
								linkList.push(idx);
							}
						}
						
						h.util.dbFetcher.fetchMultipleLinksById(linkList,function(err, linkFetchResult){
							if(err){
								h.responses.error(500,"Internal server error.",res,next);
							}
							else{	

								//append results
								docList.forEach(function(docId){
							    	if(fetchResult[docId] === null || fetchResult[docId]["document"] === null|| fetchResult[docId]["document"][docId] === null){
								    	//misses
							    		results[h.util.uri.document(docId)] = {
							    				error : {
							    					reason : "Not found"
							    				}
							    		}
							    	}
								    else{
								    	//hits
								    	results[h.util.uri.document(docId)] = h.util.renderer.documentFull(fetchResult[docId],linkFetchResult);
								    }

								});
								
								
								res.send(200, {
									results : results
								});
								return next();		
							}
						});
						
						
								
					}
				});
			});
		},

		batchMetadata : function(req, res, next) {
			validateDocumentList(req.params, res,next, function(invalidUris, list){
				
				var docList = [];
				list.forEach(function(docId){
					docList.push(["document",docId,"document",docId]);
				});
				
				h.util.dbFetcher.fetchDocumentResourcesByKey(docList,function(err, fetchResult){
					if(err){
						h.responses.error(500,"Internal server error.",res,next);
					}
					else{
						var results = {};
						//append invalid uris
						invalidUris.forEach(function(uri){
							results[uri] = {
									error : {
										reason : "Invalid URI"
									}
							}
						});
						//append results
				    	list.forEach(function(docId){
					    	if(!fetchResult[docId]  || !fetchResult[docId]["document"] || !fetchResult[docId]["document"][docId]){
						    	//misses
					    		results[h.util.uri.document(docId)] = {
					    				error : {
					    					reason : "Not found"
					    				}
					    		}
					    	}
						    else{
						    	//hits
						    	results[h.util.uri.document(docId)] = h.util.renderer.documentMeta(fetchResult[docId]);
						    }
						});
						
						res.send(200, {
							results : results
						});
						return next();					
					}
				});
			});
		},
		
		getSnapshot : function(req, res, next) {
			h.util.dbFetcher.fetchMultipleDocSnapshotsById([req.uriParams.documentId],function(err, fetchResult){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(fetchResult)){
					h.responses.error(404,"Document not found.",res,next);
				}
				else{
					res.send(200, h.util.renderer.documentSnapshot(fetchResult[req.uriParams.documentId]));
					return next();
				}
			});
		},
		
		batchSnapshot : function(req, res, next) {
			validateDocumentList(req.params, res,next, function(invalidUris, docList){
				
				h.util.dbFetcher.fetchMultipleDocsById(docList,function(err, fetchResult){
					if(err){
						h.responses.error(500,"Internal server error.",res,next);
					}
					else{
						
						var results = {};
						
						//append invalid uris
						invalidUris.forEach(function(uri){
							results[uri] = {
									error : {
										reason : "Invalid URI"
									}
							}
						});
						//append results
						docList.forEach(function(docId){
					    	if(!fetchResult[docId]  || !fetchResult[docId]["document"] || !fetchResult[docId]["document"][docId]){
						    	//misses
					    		results[h.util.uri.document(docId)] = {
					    				error : {
					    					reason : "Not found"
					    				}
					    		}
					    	}
						    else{
						    	//hits
						    	results[h.util.uri.document(docId)] = h.util.renderer.documentSnapshot(fetchResult[docId]);
						    }

						});
						
						res.send(200, {
							results : results
						});
						return next();		
								
					}
				});
			});
		},
		
	};
};