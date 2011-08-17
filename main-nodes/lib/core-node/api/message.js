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
						console.dir(code);
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
			
			h.util.dbFetcher.fetchMessage(req.uriParams.messageId, function(err,doc){
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
			
			res.send(501);
			return next();
		},
		
		forwardBox : function(req, res, next) {
			var type = validateBoxType(req.uriParams.box)
			if(!type){
				h.responses.error(404,"Invalid box type.",response,next);
				return;
			}
			
			h.util.dbPaginator.forward("users/messagebox",function(row){
				return row;
//				return row.key[1];
			},function(err,cursor){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if ( cursor === null){
					res.send(204);
					return next();
				}
				else{
					console.dir(cursor);
					var uri = h.util.uri.userListPage(cursor);
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
			
//			res.send(501);
//			return next();
		},
		
		listBox : function(req, res, next) {
			var type = validateBoxType(req.uriParams.box)
			if(!type){
				h.responses.error(404,"Invalid box type.",response,next);
				return;
			}
			
			res.send(501);
			return next();
		},

		get : function(req, res, next) {
			var type = validateBoxType(req.uriParams.box)
			if(!type){
				h.responses.error(404,"Invalid box type.",response,next);
				return;
			}
			
			h.util.dbFetcher.fetchMessage(req.uriParams.messageId, function(err,doc){
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