/**
 * Atom Feed Handler
 * 
 * @author Benjamin Erb
 * 
 */

var fs = require('fs');
var path = require('path');

module.exports = function(h) {

	var PAGINATION_SIZE = h.options.feed.parameters.paginationSize || 20;

	//Collect all known/allowed media types 
	var knownMediaTypes = {};
	[h.options.mediatypes.stored || {}].forEach(function(type){
		for(var idx in type){
			if(type.hasOwnProperty(idx)){
				knownMediaTypes[idx.split("/")[0]] = true;
			}
		}
	});
	(h.options.mediatypes.external || []).forEach(function(mediaType){
		knownMediaTypes[mediaType.split("/")[0]] = true;
	});

	//load all templates on init, blocking calls do not interfere here
	var template = {
			documents : fs.readFileSync(path.join(__dirname, "..","templates","documents.xml" ),"utf-8"),	
			documentDetails : fs.readFileSync(path.join(__dirname, "..","templates","documentdetails.xml" ),"utf-8"),	
			attachments : fs.readFileSync(path.join(__dirname, "..","templates","attachments.xml" ),"utf-8"),	
			comments : fs.readFileSync(path.join(__dirname, "..","templates","comments.xml" ),"utf-8"),	
			media : fs.readFileSync(path.join(__dirname, "..","templates","mediadocuments.xml" ),"utf-8"),	
	};
	
	var handleAttachment = function(item){
		var isExternal = (item.doc.external !== undefined ? true : false);
		var isStored = !isExternal;
		
		var storageUri, externalUri, fileSize = null;
		if(isStored){
			storageUri = h.options.common.endpoints.storage + "/" + item.doc.documentId + "/" + item.doc.attachmentId + "." + h.options.mediatypes.stored[item.doc.mimeType].extension;
			fileSize = item.doc.fileSize;
		}
		else{
			externalUri = item.doc.external;
		}
		
		return {
				userUri : h.util.coreUri.user(item.doc.publisher),
				documentId : item.doc.documentId,
				attachmentId : item.doc.attachmentId,
				documentUri : h.util.coreUri.document(item.doc.documentId),
				attachmentUri : h.util.coreUri.attachment(item.doc.documentId, item.doc.attachmentId),
				title : item.doc.title,
				description : item.doc.description,
				publishedTime : item.doc.publishedTime,
				mimeType : item.doc.mimeType,
				mediaType : item.doc.mimeType.split("/")[0],
				isStored : isStored,
				isExternal : isExternal,
				storageUri : storageUri,
				externalUri : externalUri,
				fileSize : fileSize
				
			};
	}
	
	var handleComment = function(item){
		return {
				userUri : h.util.coreUri.user(item.doc.publisher),
				documentId : item.doc.documentId,
				commentId : item.doc.commentId,
				documentUri : h.util.coreUri.document(item.doc.documentId),
				commentUri : h.util.coreUri.comment(item.doc.documentId, item.doc.commentId),
				content : item.doc.content,
				creationTime : item.doc.creationTime,
			};
	}
	
	var handleAttachmentList = function(list){
		var entries = [];
		list.forEach(function(item){
			entries.push(handleAttachment(item));
		});
		return entries;
	};
	
	var handleCommentList = function(list){
		var entries = [];
		list.forEach(function(item){
			entries.push(handleComment(item));
		});
		return entries;
	};
	
	var handleMixedList = function(list){
		
		var entries = [];
		list.forEach(function(item){
			if(item.doc.type === "attachment"){
				var entry = handleAttachment(item);
				entry.isAttachment = true;
				entries.push(entry);
			}
			else if(item.doc.type === "comment"){
				var entry = handleComment(item);
				entry.isComment = true;
				entries.push(entry);
			}
		});
		return entries;
	};
	
	return {

		getDocumentsFeed : function(req, res, next) {
			
			var fetchPage = function(startKey){
				h.util.feedPaginator.getPage('docs/docs_by_date', startKey, [], PAGINATION_SIZE, true, true, function(row){
					return {
						key : row.key[1],
						doc : row.doc
					};
				}, function(err, result){
					if(err){
						res.send(500);
					}
					else{
						
						var entries = [];
						
						result.list.forEach(function(item){
							entries.push({
								userUri : h.util.coreUri.user(item.doc.publisher),
								documentId : item.doc.documentId,
								documentUri : h.util.coreUri.document(item.doc.documentId),
								title : item.doc.title,
								description : item.doc.description,
								publishedTime : item.doc.publishedTime,
							});
						});
						
						var hasNext = false;
						var hasPrevious = false;
						var nextUri = "";
						var previousUri = "";
						
						var selfUri;
						if(result.list[0]){
							selfUri = h.util.uri.documentsFeedPage(result.list[0].key);
						}
						else{
							selfUri = h.util.uri.documentsFeed();
						}
						
						//descending, so reverse order
						if(result["next"]){
							hasPrevious = true;
							previousUri = h.util.uri.documentsFeedPage(result["next"].key);
						}
						if(result["previous"]){
							hasNext = true;
							nextUri = h.util.uri.documentsFeedPage(result["previous"].key);
						}
						
						var headers = {
								"Content-Type" : "application/atom+xml"
						};
						
						var data = {
							hub : h.options.feed.hub.uri,
							serverName : h.options.server.name,
							serverVersion : h.options.server.version,
							title : h.options.feed.deployment.title,
							
							feedUri : h.util.uri.documentsFeed(),
							selfUri : selfUri,
							entries : entries,
							
							hasNext : hasNext,
							hasPrevious : hasPrevious,
							nextUri : nextUri,
							previousUri : previousUri,
						};

						
						h.util.dbFetcher.fetchLatestViewRow(false,true,'docs/docs_by_date', function(err, row){
							if(err){
								data.updated = new Date().toRFC3339UTCString();
							}
							else{
								data.updated = row.key[0];
							}
							var feed = h.mustache.to_html(template.documents, data)
							
							res.sendArbitrary(200, feed,headers);
							return next();
						});
						

					}
				});
			}

			//cursor ID present, so retrieve cursor doc first
			if(req.uriParams.cursorId){
				h.util.dbFetcher.fetch(req.uriParams.cursorId, h.c.DOCUMENT, function(err, doc){
					if(err && err === 404){
						h.responses.error(404,"Cursor not found.",res,next);
						return;
					}
					else if(err){
						h.responses.error(500,"Internal server error.",res,next);
						return;
					}
					else{
						fetchPage([doc.publishedTime, doc.documentId]);	
					}
				});
			}
			else{
				fetchPage([{}]);	
			}
		},

		getAttachmentsFeed : function(req, res, next) {
			var fetchPage = function(startKey){
				h.util.feedPaginator.getPage('docs/attachments_by_date', startKey, [], PAGINATION_SIZE, true, true, function(row){
					return {
						key : row.key[1],
						doc : row.doc
					};
				}, function(err, result){
					if(err){
						res.send(500);
					}
					else{
						
						var entries = handleAttachmentList(result.list);
						
						var hasNext = false;
						var hasPrevious = false;
						var nextUri = "";
						var previousUri = "";
						
						var selfUri;
						if(result.list[0]){
							selfUri = h.util.uri.attachmentsFeedPage(result.list[0].key);
						}
						else{
							selfUri = h.util.uri.attachmentsFeed();
						}
						
						//descending, so reverse order
						if(result["next"]){
							hasPrevious = true;
							previousUri = h.util.uri.attachmentsFeedPage(result["next"].key);
						}
						if(result["previous"]){
							hasNext = true;
							nextUri = h.util.uri.attachmentsFeedPage(result["previous"].key);
						}
						
						var headers = {
								"Content-Type" : "application/atom+xml"
						};
						
						var data = {
							hub : h.options.feed.hub.uri,
							serverName : h.options.server.name,
							serverVersion : h.options.server.version,
							title : h.options.feed.deployment.title,
							
							feedUri : h.util.uri.attachmentsFeed(),
							selfUri : selfUri,
							entries : entries,
							
							hasNext : hasNext,
							hasPrevious : hasPrevious,
							nextUri : nextUri,
							previousUri : previousUri,
						};

						
						h.util.dbFetcher.fetchLatestViewRow(false,true,'docs/attachments_by_date', function(err, row){
							if(err){
								data.updated = new Date().toRFC3339UTCString();
							}
							else{
								data.updated = row.key[0];
							}
							var feed = h.mustache.to_html(template.attachments, data)
							res.sendArbitrary(200, feed,headers);
							return next();
						});

					}
				});
			}

			//cursor ID present, so retrieve cursor doc first
			if(req.uriParams.cursorId){
				h.util.dbFetcher.fetchViewDoc(req.uriParams.cursorId, "docs/attachments_by_id", function(err, doc){
					if(err && err === 404){
						h.responses.error(404,"Cursor not found.",res,next);
						return;
					}
					else if(err){
						h.responses.error(500,"Internal server error.",res,next);
						return;
					}
					else{
						fetchPage([doc.publishedTime, doc.attachmentId]);	
					}
				});
			}
			else{
				fetchPage([{}]);	
			}
		},

		getCommentsFeed : function(req, res, next) {
			var fetchPage = function(startKey){
				h.util.feedPaginator.getPage('docs/comments_by_date', startKey, [], PAGINATION_SIZE, true, true, function(row){
					return {
						key : row.key[1],
						doc : row.doc
					};
				}, function(err, result){
					if(err){
						res.send(500);
					}
					else{
						
						var entries = handleCommentList(result.list);
						
						var hasNext = false;
						var hasPrevious = false;
						var nextUri = "";
						var previousUri = "";
						
						var selfUri;
						if(result.list[0]){
							selfUri = h.util.uri.commentsFeedPage(result.list[0].key);
						}
						else{
							selfUri = h.util.uri.commentsFeed();
						}
						
						//descending, so reverse order
						if(result["next"]){
							hasPrevious = true;
							previousUri = h.util.uri.commentsFeedPage(result["next"].key);
						}
						if(result["previous"]){
							hasNext = true;
							nextUri = h.util.uri.commentsFeedPage(result["previous"].key);
						}
						
						var headers = {
								"Content-Type" : "application/atom+xml"
						};
						
						var data = {
							hub : h.options.feed.hub.uri,
							serverName : h.options.server.name,
							serverVersion : h.options.server.version,
							title : h.options.feed.deployment.title,
							
							feedUri : h.util.uri.commentsFeed(),
							selfUri : selfUri,
							entries : entries,
							
							hasNext : hasNext,
							hasPrevious : hasPrevious,
							nextUri : nextUri,
							previousUri : previousUri,
						};
						
						h.util.dbFetcher.fetchLatestViewRow(false,true,'docs/comments_by_date', function(err, row){
							if(err){
								data.updated = new Date().toRFC3339UTCString();
							}
							else{
								data.updated = row.key[0];
							}
							var feed = h.mustache.to_html(template.comments, data)
							
							res.sendArbitrary(200, feed,headers);
							return next();
						});
					}
				});
			}

			//cursor ID present, so retrieve cursor doc first
			if(req.uriParams.cursorId){
				h.util.dbFetcher.fetchViewDoc(req.uriParams.cursorId, "docs/comments_by_id", function(err, doc){
					if(err && err === 404){
						h.responses.error(404,"Cursor not found.",res,next);
						return;
					}
					else if(err){
						h.responses.error(500,"Internal server error.",res,next);
						return;
					}
					else{
						fetchPage([doc.creationTime, doc.commentId]);	
					}
				});
			}
			else{
				fetchPage([{}]);	
			}
		},

		

		getDocumentDetailsFeed : function(req, res, next) {
			var fetchPage = function(startKey){
				h.util.feedPaginator.getPage('docs/doc_details_by_date', startKey, [req.uriParams.documentId], PAGINATION_SIZE, true, true, function(row){
					return {
						key : row.key[3],
						doc : row.doc
					};
				}, function(err, result){
					if(err){
						res.send(500);
					}
					else{
						
						var entries = handleMixedList(result.list);

						var selfUri = h.util.uri.documentDetailsFeed(req.uriParams.documentId);
						
						var headers = {
								"Content-Type" : "application/atom+xml"
						};
						
						var data = {
							hub : h.options.feed.hub.uri,
							serverName : h.options.server.name,
							serverVersion : h.options.server.version,
							title : h.options.feed.deployment.title,
							documentId : req.uriParams.documentId,
							
							feedUri : selfUri,
							selfUri : selfUri,
							entries : entries,
							
							
						};
						
						h.util.dbFetcher.fetchLatestViewRow(false,true,'docs/doc_details_by_date', function(err, row){
							if(err){
								data.updated = new Date().toRFC3339UTCString();
							}
							else{
								data.updated = row.key[1];
							}
							
							var feed = h.mustache.to_html(template.documentDetails, data)
							
							res.sendArbitrary(200, feed,headers);
							return next();
						});
					}
				});
			}

			h.util.dbFetcher.exist(req.uriParams.documentId, h.c.DOCUMENT, function(code){
				if(code === 200){
					fetchPage([req.uriParams.documentId,{}]);	
				}
				else if(code = 404){
					h.responses.error(404,"Cursor not found.",res,next);
					return;
				}
				else{
					h.responses.error(500,"Internal server error.",res,next);
					return;
				}
			})
		},

		getMediaFeed : function(req, res, next) {
			var fetchPage = function(startKey){
				h.util.feedPaginator.getPage('docs/docs_by_mediatype', startKey, [req.uriParams.mediaType], PAGINATION_SIZE, true, true, function(row){
					return {
						key : row.key[2],
						doc : row.doc
					};
				}, function(err, result){
					if(err){
						res.send(500);
					}
					else{
						
						var entries = [];
						
						result.list.forEach(function(item){
							entries.push({
								userUri : h.util.coreUri.user(item.doc.publisher),
								documentId : item.doc.documentId,
								documentUri : h.util.coreUri.document(item.doc.documentId),
								title : item.doc.title,
								description : item.doc.description,
								publishedTime : item.doc.publishedTime,
							});
						});
						
						var hasNext = false;
						var hasPrevious = false;
						var nextUri = "";
						var previousUri = "";
						
						var selfUri;
						if(result.list[0]){
							selfUri = h.util.uri.documentsFeedPage(result.list[0].key);
						}
						else{
							selfUri = h.util.uri.documentsFeed();
						}
						
						//descending, so reverse order
						if(result["next"]){
							hasPrevious = true;
							previousUri = h.util.uri.documentsFeedPage(result["next"].key);
						}
						if(result["previous"]){
							hasNext = true;
							nextUri = h.util.uri.documentsFeedPage(result["previous"].key);
						}
						
						var headers = {
								"Content-Type" : "application/atom+xml"
						};
						
						var data = {
							hub : h.options.feed.hub.uri,
							serverName : h.options.server.name,
							serverVersion : h.options.server.version,
							title : h.options.feed.deployment.title,
							
							feedUri : h.util.uri.documentsFeed(),
							selfUri : selfUri,
							entries : entries,
							
							type: req.uriParams.mediaType,
							
							hasNext : hasNext,
							hasPrevious : hasPrevious,
							nextUri : nextUri,
							previousUri : previousUri,
						};

						
						h.util.dbFetcher.fetchLatestViewRow(false,true,'docs/docs_by_mediatype', function(err, row){
							if(err){
								data.updated = new Date().toRFC3339UTCString();
							}
							else{
								data.updated = row.key[1];
							}
							var feed = h.mustache.to_html(template.media, data)
							
							res.sendArbitrary(200, feed,headers);
							return next();
						});
						

					}
				});
			}

			
			if(knownMediaTypes[req.uriParams.mediaType]){
				
				//cursor ID present, so retrieve cursor doc first
				if(req.uriParams.cursorId){
					h.util.dbFetcher.fetch(req.uriParams.cursorId, h.c.DOCUMENT, function(err, doc){
						if(err && err === 404){
							h.responses.error(404,"Cursor not found.",res,next);
							return;
						}
						else if(err){
							h.responses.error(500,"Internal server error.",res,next);
							return;
						}
						else{
							fetchPage([doc.mediaType,doc.publishedTime, doc.documentId]);	
						}
					});
				}
				else{
					fetchPage([req.uriParams.mediaType,{}]);	
				}
			}
			else{
				h.responses.error(404,"Media type not found.",res,next);
				return;
			}
		},
	};
};