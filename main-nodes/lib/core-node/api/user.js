require("rfc3339date");
var crypto = require('crypto');

module.exports = function(h) {
	
	var BATCH_LIMIT = h.options.core.parameters.batchLimit || 50;
	var PAGINATION_SIZE = h.options.core.parameters.paginationSize || 20;
	
	/*
	 * ------------------------------ Validation Functions --------------------------------
	 */
	
	/**
	 * Validates submitted user data  
	 */
	var validateUserData = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400,"Invalid user account values. " + (msg || "Please check your entity structure."),response,next);
		};		
		
		if (!data || !data.email|| !data.password|| !data.username) {
			fail("Attributes are missing.");
			return;
		}
		
		//TODO: uncomment
//		//copied from http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
//		var emailAddress = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; 
//		if(!data.email.match(emailAddress)){
//			fail("Invalid email address.");
//			return;
//		}
		
		callback({
			email : data.email,
			password : data.password,
			username : data.username
		});
	};
	
	/**
	 * Takes a list of request user URIs and divides them into syntactically valid and invalid groups.
	 */
	var validateUserList = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400,"Invalid batch request. " + (msg || "Please check your entity structure."),response,next);
		};		
		
		if (!data || !data.users || !data.users.length || data.users.length < 1) {
			fail("No users list.");
			return;
		}
		
		var entries = {};
		
		var validIds = [];
		var invalidUris = [];
		
		data.users.forEach(function(userUri) {
			
			var parsedUri = h.util.uriParser.extractUserId(userUri);
			if(parsedUri){
				validIds.push(parsedUri.userId);
			}
			else{
				invalidUris.push(userUri)
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
	
	
	/**
	 * Takes an valid list of userId, converts them to document Ids an runs a batch query for all.
	 * Returns an object of all user docs
	 */
	var fetchUserDocs = function(list, callback){
		h.util.dbHelper.batchFetch(list, h.c.USER ,callback);
	};

	
	/**
	 * Returns a CouchDB document represesting the given user
	 */
	var getUserDoc = function(userId, callback){
		fetchUserDocs([userId], function(err,list){
			if(err){
				callback(err)
			}
			else{
				callback(null,list[userId]);
			}
		});
	};
	
	
	/**
	 * Creates a new user account.
	 */
	var createNewUser = function(req,res,next){
		validateUserData(req.params, res, next, function(data){
			
			var md5calc = crypto.createHash('md5');
			md5calc.update(data.email);
			var userId = md5calc.digest('hex');
			
			var docId = h.c.USER.wrap(userId);
			
			data.creationTime = new Date().toRFC3339UTCString();
			data.enabled = true;
			
			data.type = h.c.USER.TYPE;
			
			var saveUser = function(){
				h.db.save(docId, data, function(err, dbRes) {
					if (err) {
						h.responses.error(500,"Internal server error. Please try again later.",res,next);
					}
					else {
						res.send(201, {
							"link" : h.util.link(h.util.uri.user(userId))
						}, {
							'Location' : h.util.uri.user(userId)
						});
						return next();
					}
				});
			};
			
			h.db.head(docId, function(err, headers,code) {
				if(code && code === 404){
					saveUser();
				}
				else if(code && code === 200){
					h.responses.error(409,"User already exists.",res,next);
				}
				else {
					console.dir(code);
					h.responses.error(500,"Internal server error. Please try again later.",res,next);
				}
			});

		});
	};
	
	/**
	 * Changes an existing user account. 
	 */
	var changeUser = function(req,res,next){
		validateUserData(req.params, res, next, function(data){
			
			var md5calc = crypto.createHash('md5');
			md5calc.update(data.email);
			var userId = md5calc.digest('hex');
			
			if(userId === req.authenticatedUser){
				getUserDoc(userId, function(err, doc){
					doc.email = data.email;
					doc.username = data.username;
					doc.password = data.password;
					
					h.db.save(doc._id, doc._rev, doc, function(err, dbRes) {
						if (err) {
							h.responses.error(500,"Internal server error. Please try again later.",res,next);
						}
						else {
							res.send(202, {
								"link" : h.util.link(h.util.uri.user(userId))
							}, {
								'Location' : h.util.uri.user(userId)
							});
							return next();
						}
					});					
					
				});
			}
			else{
				h.responses.error(403,"This service does not allow the email address to be changed.",res,next);
			}
		});
	};

	/**
	 * Takes a CouchDB user document and creates a result JSON.
	 * The optional 'authUserId' param can be used to add private data to the result,
	 * when the requesting user is querying his own profile.
	 */
	var renderResult = function(userDoc, authUserId){
		var id = h.c.USER.unwrap(userDoc._id);
		var result = {
			"user" : {
				"username" : userDoc.username,
				"link" : h.util.link(h.util.uri.user(id))
			}	
		};
		if(authUserId && id === authUserId){
			result.user.email = userDoc.email;
		}
		return result;
	};
	
	return {

		get : function(req, res, next) {
			getUserDoc(req.uriParams.userId, function(err,userDoc){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(userDoc === null){
					h.responses.error(404,"User not found.",res,next);
				}
				else{
					res.send(200, renderResult(userDoc,req.authenticatedUser),{
						"ETag" : '"'+userDoc._rev+'"'
					});
				}
			});
		},
		
		fetchMultiple : function(req, res, next) {
			validateUserList(req.params, res,next, function(invalidUris, list){
				fetchUserDocs(list, function(err, users){
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
						for(var u in users) {
						    if(users.hasOwnProperty(u))
					    	{
						    	if(users[u] === null){
							    	//misses
						    		results[h.util.uri.user(u)] = {
						    				error : {
						    					reason : "Not found"
						    				}
						    		}
						    	}
							    else{
							    	//hits
							    	results[h.util.uri.user(u)] = renderResult(users[u],req.authenticatedUser);
							    }
					    	}
						}
						
						res.send(200, {
							results : results
						});
						return next();
					}
				});
			});
		},		
		
		change : function(req, res, next) {
			changeUser(req,res,next);
		},
		
		create : function(req, res, next) {
			if(!!h.options.core.allowNewUsers){
				createNewUser(req,res,next);
			}
			else{
				h.responses.error(403,"The creation of new user accounts has been disabled.",res,next);
			}
		},
		
		forwardUsers : function(req, res, next) {
			h.util.dbPaginator.forward("users/user_by_date", [], function(row){
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
					var uri = h.util.uri.userListPage(cursor);
					res.send(303, {
						link :  h.util.link(uri)
					},{'Location' : uri});
					return next();
				}
			});
		},
		
		listUsers : function(req, res, next) {
			
			getUserDoc(req.uriParams.cursorId, function(err,userDoc){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if (userDoc === null){
					h.responses.error(404,"Cursor not found.",res,next);
				}
				else{
					
					var key = [userDoc.creationTime, req.uriParams.cursorId];
					
					h.util.dbPaginator.getPage('users/user_by_date', key, [], PAGINATION_SIZE, false, false, function(row){
						return {
							key : row.key[1],
							name : row.value
						};
					}, function(err, result){
						if(err){
							res.send(500);
						}
						else{
							
							var list = result.list.map(function(user){
								return {
									user : {
										link : h.util.link(h.util.uri.user(user.key)),
										username : user.name
									}
								}
							});
							
							var related = [];
							["next", "previous"].forEach(function(e){
								if(result[e]){
									related.push({
										"link" : h.util.link(h.util.uri.userListPage(result[e].key), e)
									});
								}
							});
							
							var headers = {};
							if(result.etag){
								headers["Etag"] = '"'+result.etag+'"';
							}
							
							res.send(200, {
								"page" : {
									"link" : h.util.link(h.util.uri.userListPage(req.uriParams.cursorId))
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
	};
};