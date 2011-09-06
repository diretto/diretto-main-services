require("rfc3339date");

var qstring = require('querystring');
var crypto = require('crypto');

module.exports = function(h) {

	var BATCH_LIMIT = h.options.core.parameters.batchLimit || 50;
	var PAGINATION_SIZE = h.options.core.parameters.paginationSize || 20;

	
	var validateQuery = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400,"Invalid query request. " + (msg || "Please check your entity structure."),response,next);
		};		
		
		if (!data || !data.query) {
			fail("Empty query.");
			return;
		}
		
		if(!data.query.time || !data.query.time.start || !data.query.time.end || (typeof data.query.time.start !== "string") || (typeof data.query.time.end !== "string") || !h.util.commonValidator.validateDate(data.query.time.start)  || !h.util.commonValidator.validateDate(data.query.time.end) ){
			fail("Invalid time.");
			return;
		}
		
		if(!data.query.location || !data.query.location.bbox || !data.query.location.bbox.length || data.query.location.bbox.length !== 4){
			fail("Invalid time.");
			return;
		}
		
		if(data.query.tags === undefined || (data.query.tags !== null && (!data.query.tags.length))){
			fail("Invalid tag list.");
			return;
		}		
		if(data.query.publishedBetween === undefined || (data.query.publishedBetween !== null && (!data.query.publishedBetween.start || !data.query.publishedBetween.end || !h.util.commonValidator.validateDate(data.query.publishedBetween.start) || !h.util.commonValidator.validateDate(data.query.publishedBetween.end) ))){
			fail("Invalid tag list.");
			return;
		}
		
		var result = {
				"query" : {
					"time" : {
						start : data.query.time.start,
						end : data.query.time.end
					},
					"location" : {
						"bbox" : data.query.location.bbox
					},		
					tags : data.query.tags || [],
					publishedBetween : null
				}
			};
		if(data.query.publishedBetween){
			result.query["publishedBetween"] = {
				start : data.query.publishedBetween.start, 
				end : data.query.publishedBetween.end
			};
		}
		
		callback(result);
	};
	
	var buildQuery = function(data, callback){
		
		//extract tags
		var tagList = [];
		data.query.tags.forEach(function(uri){
			var parsedTagUri = h.util.uriParser.extractBaseTagId(uri); 
			if(parsedTagUri !== null){
				tagList.push(parsedTagUri.baseTagId);
			}
		});
		
		var start = Date.parse(data.query.time.start).getTime();
		var end = Date.parse(data.query.time.end).getTime();
		var lon1 = data.query.location.bbox[0]; 
		var lat1 = data.query.location.bbox[1]; 
		var lon2 = data.query.location.bbox[2]; 
		var lat2 = data.query.location.bbox[3]; 

		
		var q = "(" +
				"(lat1<double>:["+lat1+" TO "+lat2+"] OR lat2<double>:["+lat1+" TO "+lat2+"] OR ((lat1<double>:[-90 TO "+lat1+"]) AND (lat2<double>:["+lat2+" TO 90]))) " +
				" AND " +
				"(lon1<double>:["+lon1+" TO "+lon2+"] OR lon2<double>:["+lon1+" TO "+lon2+"] OR ((lon1<double>:[-180 TO "+lon1+"]) AND (lon2<double>:["+lon2+" TO 180]))) " +
			")";
		
		// temporal
		q = q + " AND (" +
				"(after<long>:["+start+" TO "+end+"] OR before<long>:["+start+" TO "+end+"] OR ((after<long>:[0 TO "+start+"]) AND (before<long>:["+end+" TO 2918834151765]))) " +
			")";
		
		// Tags
		if(tagList.length > 0){
			q = q + " AND tags:(" +
						tagList.join(" AND ") +
				")";
		}
		
		if(data.query.publishedBetween){
			var pubStart = Date.parse(data.query.publishedBetween.start).getTime();
			var pubEnd = Date.parse(data.query.publishedBetween.end).getTime();

			q = q + " AND publishedTime<long>:["+pubStart+" TO "+pubEnd+"]";
			
		}
		data.querystring = "q="+qstring.escape(q); 
		
		
		// hash string
		var md5calc = crypto.createHash('md5');
		md5calc.update(data.querystring);
		data.hash = md5calc.digest('hex');
		
		callback(data);
	};
	
	var storeQuery = function(data, res, next){
		buildQuery(data, function(queryData){
			
			//check if query already exists
			h.util.dbFetcher.exist(queryData.hash, h.c.QUERY, function(code){
				if(code === 200){
					res.send(202, null, {
						Location: h.util.uri.query(data.hash)
					});
					return next();
				}
				else if(code === 404){
					
					queryData.type = h.c.QUERY.TYPE;
					queryData._id = h.c.QUERY.wrap(queryData.hash);
					queryData.creationTime =  new Date().toRFC3339UTCString();
					
					h.db.save(queryData._id, queryData, function(err, dbRes) {
						if (err) {
							h.responses.error(500,"Internal server error. Please try again later.",res,next);
						}
						else {
							res.send(202, null, {
								Location: h.util.uri.query(data.hash)
							});
							return next();
						}
					});					
					
				}
				else{
					h.responses.error(500,"Internal server error. Please try again later.",res,next);
				}
				
			});
		});
	};
	
	
	var fetchQueryString = function(queryId, callback){
		h.util.dbFetcher.fetch(queryId, h.c.QUERY, function(err, doc){
			if(err){
				callback(err);
			}
			else{
				callback(null, doc.querystring);
			}
		});
	};
	
	var fetchResultPage = function(querystring, cursor, callback){
		
		cursor = parseInt(cursor) || 1;
		
		var q = querystring;
		if(cursor !== null && typeof(cursor) === 'number'){
			q = q + "&limit="+PAGINATION_SIZE+"&skip="+((cursor -1)* PAGINATION_SIZE);
		}
		else{
			q = q + "&limit=1";
		}
		
		h.db.fti('docs/docs', q, function(err, dbRes){
			if(err || (dbRes && dbRes.headers && dbRes.headers.status && dbRes.headers.status !== 200)){
				callback(err || dbRes.headers.status);
				return;
			}
			else{
				callback(null, dbRes.json.total_rows, dbRes);
				return;
			}
		});
	};
	
	
	return {

		create : function(req, res, next) {
			validateQuery(req.params, res, next, function(data){
				storeQuery(data, res,next);				
			});
		},
		
		forward : function(req, res, next) {
			fetchQueryString(req.uriParams.queryId, function(err, querystring){
				if(err){
					h.responses.error(500,"Internal server error. Please try again later.",res,next);
				}
				else{
					fetchResultPage(querystring, null, function(err, count, results){
						if(err){
							res.send((err === 404 ? 404 : 500), null, {});
							next();
						}
						else{
							if(count > 0){
								res.send(303, null, { "Location": h.util.uri.queryPage(req.uriParams.queryId,1) });
								next();
							}
							else{
								res.send(204, null, {});
								next();
							}
						}
					});
				}
			});
		},
		
		resultPage : function(req, res, next) {
			fetchQueryString(req.uriParams.queryId, function(err, querystring){
				if(err){
					res.send(err || 500, null, {});
					next();
				}
				else{
					var cursorId = req.uriParams.cursorId;
					var queryId = req.uriParams.queryId;
					
					cursorId = parseInt(cursorId) || -1;
					
					if(cursorId === -1 && cursorId < 1){
						res.send(404, null, {});
						next();
						return;
					}
					
					fetchResultPage(querystring, cursorId, function(err, count, results){
						
						if(err){
							res.send((err === 404 ? 404 : 500), null, {});
							next();
						}
						else{
							if(count > 0 && results.length > 0){
								
								var list = [];
								
								results.forEach(function(item){
									list.push({
										"document" : {
											"link" : {
												"rel" : "self",
												"href" :  h.util.uri.document(item.id.substr(2))
											}
										} 
									})
								});
								
								var page = {
										"link" : {
											"rel" : "self",
											"href" : h.util.uri.queryPage(queryId, cursorId)
										}, 
										"related": [{
											"link" : {
												"rel" : "first",
												"href" : h.util.uri.queryPage(req.uriParams.queryId,1)
											} 
										}],
										"list" : list
								};
								
								var maxPages = Math.ceil(count / PAGINATION_SIZE);
								
								
								if(cursorId < maxPages){
									page.related.push({
										"link" : {
											"rel" : "next",
											"href" : h.util.uri.queryPage(req.uriParams.queryId,(cursorId +1))
										} 
									});
								}
								
								if(cursorId > 1){
									page.related.push({
										"link" : {
											"rel" : "previous",
											"href" : h.util.uri.queryPage(req.uriParams.queryId,(cursorId -1))
										} 
									});
								}
								
								
								res.send(200, {
									"query" : {
										"link" : {
											"rel" : "self",
											"href" : h.util.uri.query(req.uriParams.queryId)
										} 
									},
									"results" : {
										count : count,
										page : page
									}
								}, {});
								next();
							}
							else{
								res.send(404, null, {});
								next();
							}

						}
					});
				}
			});
		}
		
		

	};
};