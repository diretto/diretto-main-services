require("rfc3339date");
var crypto = require('crypto');

module.exports = function(h) {
	
	var BATCH_LIMIT = h.options.core.parameters.batchLimit || 50;
	var PAGINATION_SIZE = h.options.core.parameters.paginationSize || 20;
	
	var MIN_TITLE_LENGTH = 3;
	var MAX_TITLE_LENGTH = 128;
	var MAX_CONTENT_LENGTH = 1024;
	
	var IN = 1;
	var OUT = 2;
	
	
	/*
	 * ------------------------------ Validation Functions --------------------------------
	 */
	
	/**
	 * Checks if the given box type is inbox, outbox or invalid using constants.
	 * 
	 */
	var validateBoxType = function(boxType, response, next){
		if(boxType === 'inbox'){
			return IN;
		}
		else if(boxType === 'outbox'){
			return OUT;
		}
		else{
			return null;
		}
	}
	
	/**
	 * Validates a new message to be send.
	 */
	var validateMessage = function(data, response, next, callback){
		var fail = function(msg) {
			h.responses.error(400,"Invalid message. " + (msg || "Please check your entity structure."),response,next);
		};		
		
		if (!data || !data.title|| !data.content || !(typeof (data.title) == 'string') || !(typeof (data.content) == 'string')) {
			fail("Attributes are missing.");
			return;
		}
		
		if((data.title.length > MAX_TITLE_LENGTH) || (data.title.length < MIN_TITLE_LENGTH)){
			fail("Invalid title length.");
			return;
		}
		
		if(data.title.length > MAX_CONTENT_LENGTH){
			fail("The message content is too long.");
			return;
		}
		
		callback({
			title : data.title,
			content : data.content
		});
	};
	
	/*
	 * ------------------------------- -----------------------------------------------------
	 */
	
	/**
	 * Takes a CouchDB doc representing a message and renders to our own message format.
	 */
	var renderMessage = function(msgDoc){
		
		var msgId = h.c.MESSAGE.unwrap(msgDoc._id);
		
		return {
			creationTime : msgDoc.creationTime,
			title : msgDoc.title,
			content : msgDoc.content,
			links : [{
				link : h.util.link(h.util.uri.outboxMessage(msgDoc.sender,msgId),"alternate")
			},{
				link : h.util.link(h.util.uri.inboxMessage(msgDoc.receiver,msgId),"alternate")
			}],
			sender : {
				link : h.util.link(h.util.uri.user(msgDoc.sender),"author")
			},
			receiver : {
				link : h.util.link(h.util.uri.user(msgDoc.receiver))
			},
			
		};
	};
	

	return {

		send : function(req, res, next) {
			
			validateMessage(req.params, res, next, function(data){
				
				var receiver = req.uriParams.userId;
				
				if(receiver === req.authenticatedUser){
					h.responses.error(400,"You cannot send messages to yourself.",res,next);
					return;
				}
				
				var sendMessage = function(){
					var messageId = h.uuid();
					var docId = h.c.MESSAGE.wrap(messageId);
					data.creationTime = new Date().toRFC3339UTCString();
					
					data.senderDeleted = false;
					data.receiverDeleted = false;
					
					data.sender = req.authenticatedUser;
					data.receiver = receiver
					
					data.type = h.c.MESSAGE.TYPE;
					
					h.db.save(docId, data, function(err, dbRes) {
						if (err) {
							h.responses.error(500,"Internal server error. Please try again later.",res,next);
						}
						else {
							res.send(201, {
								"link" : h.util.link(h.util.uri.outboxMessage(req.authenticatedUser,messageId))
							}, {
								'Location' : h.util.uri.outboxMessage(req.authenticatedUser,messageId)
							});
							return next();
						}
					});
				};
				
				//check if receiving user really exists
				h.db.head(h.c.USER.wrap(receiver), function(err, headers,code) {
					if(code && code === 200){
						sendMessage();
					}
					else if(code && code === 404){
						h.responses.error(404,"Receiver not found.",res,next);
						return;
					}
					else {
						h.responses.error(500,"Internal server error. Please try again later.",res,next);
						return;						
					}
				});
			});
		},
		
		remove : function(req, res, next) {
			var type = validateBoxType(req.uriParams.box)
			if(!type){
				h.responses.error(404,"Invalid box type.",response,next);
				return;
			}
			
			h.util.dbFetcher.fetch(req.uriParams.messageId, h.c.MESSAGE ,function(err,doc){
				if(err && err === 404){
					h.responses.error(404,"Message not found.",res,next);
					return;
				}
				else if(err){
					h.responses.error(500,"Internal server error. Please try again later.",res,next);
					return;
				}
				else if((type === IN && !!doc.receiverDeleted) || (type === OUT && !!doc.senderDeleted)){
					h.responses.error(410,"Message deleted.",res,next);
					return;
				}
				else{
					doc[(type === IN ? 'receiverDeleted' : 'senderDeleted')] = true;
					
					h.db.save(doc._id, doc, function(err, dbRes) {
						if (err) {
							h.responses.error(500,"Internal server error. Please try again later.",res,next);
						}
						else {
							res.send(204);
							return next();
						}
					});
				}
			});
		},
		
		forwardSince : function(req, res, next) {
			var type = validateBoxType(req.uriParams.box)
			if(!type){
				h.responses.error(404,"Invalid box type.",response,next);
				return;
			}
			
			h.util.dbPaginator.forwardSince("users/messagebox",req.uriParams.since,[req.authenticatedUser, (type === IN ? 'inbox' : 'outbox')],function(row){
				return row.key[3];
			},function(err,cursor){
				if(err){
					
					h.responses.error(500,((err.error && err.error.reason) ? err.error.reason : "Internal server error."),res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					var uri = (type === IN ? h.util.uri.inboxMessagePage(req.authenticatedUser,cursor) : h.util.uri.outboxMessagePage(req.authenticatedUser,cursor)); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		forwardBox : function(req, res, next) {
			var type = validateBoxType(req.uriParams.box)
			if(!type){
				h.responses.error(404,"Invalid box type.",response,next);
				return;
			}
			
			h.util.dbPaginator.forward("users/messagebox",[req.authenticatedUser, (type === IN ? 'inbox' : 'outbox')],function(row){
				return row.key[3];
			},function(err,cursor){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					var uri = (type === IN ? h.util.uri.inboxMessagePage(req.authenticatedUser,cursor) : h.util.uri.outboxMessagePage(req.authenticatedUser,cursor)); 
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		listBox : function(req, res, next) {
			var type = validateBoxType(req.uriParams.box)
			if(!type){
				h.responses.error(404,"Invalid box type.",response,next);
				return;
			}
			
			h.util.dbFetcher.fetch(req.uriParams.cursorId, h.c.MESSAGE, function(err,doc){
				if(err && err === 404){
					h.responses.error(404,"Cursor not found.",res,next);
					return;
				}
				else if(err){
					h.responses.error(500,"Internal server error.",res,next);
					return;
				}
				else{
					var key = [req.authenticatedUser, (type === IN ? 'inbox' : 'outbox'), doc.creationTime, req.uriParams.cursorId];
					var range = [req.authenticatedUser, (type === IN ? 'inbox' : 'outbox')];
					
					var pageLink = (type === IN ? h.util.uri.inboxMessagePage : h.util.uri.outboxMessagePage);
					
					h.util.dbPaginator.getPage('users/messagebox', key, range, PAGINATION_SIZE, false, true, function(row){
						return {
							key : row.key[3],
							doc : row.doc
						};
					}, function(err, result){
						if(err){
							res.send(500);
						}
						else{
							
							var list = result.list.map(function(message){
								return {
									message:renderMessage(message.doc)}
							});
							
							var related = [];
							["next", "previous"].forEach(function(e){
								if(result[e]){
									related.push({
										"link" : h.util.link(pageLink(req.authenticatedUser, result[e].key), e)
									});
								}
							});
							
							var headers = {};
							if(result.etag){
								headers["Etag"] = '"'+result.etag+'"';
							}
							
							res.send(200, {
								"page" : {
									"link" : h.util.link(pageLink(req.authenticatedUser,req.uriParams.cursorId))
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

		get : function(req, res, next) {
			var type = validateBoxType(req.uriParams.box)
			if(!type){
				h.responses.error(404,"Invalid box type.",response,next);
				return;
			}
			
			h.util.dbFetcher.fetch(req.uriParams.messageId, h.c.MESSAGE, function(err,doc){
				if(err && err === 404){
					h.responses.error(404,"Message not found.",res,next);
					return;
				}
				else if(err){
					h.responses.error(500,"Internal server error. Please try again later.",res,next);
					return;
				}
				else if((type === IN && !!doc.receiverDeleted) || (type === OUT && !!doc.senderDeleted)){
					h.responses.error(410,"Message deleted.",res,next);
					return;
				}
				else{
					res.send(200, {message:renderMessage(doc)});
					next();
				}
			});
		}
	};
};