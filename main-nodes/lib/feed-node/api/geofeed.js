var fs = require('fs');
var path = require('path');
var qstring = require('querystring');

module.exports = function(h) {
	
	var validateBbox  = function(data, response, next, callback) {
		var fail = function(msg) {
			h.responses.error(400, "Invalid bbox values. " + (msg || "Please check your query params."), response, next);
		};

		if (data  === undefined || data.bbox === undefined || typeof data.bbox !== "string") {
			fail("Values are missing.");
			return;
		}
		
		var d = data.bbox.split(",")
		
		if(d.length !== 4){
			fail("Incomplete bouding box.");
			return;
		}
		
		var lat1 = parseFloat(d[1]);
		var lat2 = parseFloat(d[3]);
		
		var lon1 = parseFloat(d[0]);
		var lon2 = parseFloat(d[2]);
		
		if(isNaN(lat1) || isNaN(lat2) || isNaN(lon1) || isNaN(lon2) ){
			fail("Invalid lat/lon values");
			return;
		}
		
		//TODO: validate range
		
		callback({
			lat1 : lat1,
			lat2 : lat2,
			
			lon1 : lon1,
			lon2 : lon2
		});
	};
	
	//load all templates on init, blocking calls do not interfere here
	var template = {
			bbox : fs.readFileSync(path.join(__dirname, "..","templates","bbox.kml" ),"utf-8"),	
			documentPositions : fs.readFileSync(path.join(__dirname, "..","templates","documentpositions.kml" ),"utf-8"),	
			latestDocs : fs.readFileSync(path.join(__dirname, "..","templates","latestdocs.kml" ),"utf-8")	
	};
	

	return {
		

		getDocuments : function(req, res, next) {
			h.util.feedPaginator.getPage('docs/snapshots_by_date', [{}], [], 100, true, true, function(row){
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
						console.dir(item);
						entries.push({
							userUri : h.util.coreUri.user(item.doc.publisher),
							documentId : item.doc.documentId,
							documentUri : h.util.coreUri.document(item.doc.documentId),
							title : item.doc.title || item.doc.documentId,
							description : item.doc.description || "",
							lat : item.doc.location.lat,
							lon : item.doc.location.lon,
							variance : item.doc.location.variance,
						});
					});
					
				
					
					var headers = {
							"Content-Type" : "application/vnd.google-earth.kml+xml"
					};
					
					var data = {
						serverName : h.options.server.name,
						serverVersion : h.options.server.version,
						title : h.options.feed.deployment.title,
						
						entries : entries
					};
					if(result.list[0]){
						data.updated = result.list[0].doc.creationTime; 
					}
					else{
						data.updated =  new Date().toRFC3339UTCString();
					}


					var feed = h.mustache.to_html(template.latestDocs, data)
					
					res.sendArbitrary(200, feed,headers);
					return next();
				}
			});
		},

		getDocumentPositions : function(req, res, next) {
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId, "location"],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					//empty result, so check if document exists at all
					h.util.dbFetcher.exist(req.uriParams.documentId, h.c.DOCUMENT, function(code){
						if(code === 200){
							res.send(200, h.util.renderer.locationList(req.uriParams.documentId,{}));
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
					
					var entries = [];
					
					for(var idx in result[req.uriParams.documentId]["location"]){
						if(result[req.uriParams.documentId]["location"].hasOwnProperty(idx)){
							var item = result[req.uriParams.documentId]["location"][idx];
							
							entries.push({
								userUri : h.util.coreUri.user(item.doc.publisher),
								documentId : item.doc.documentId,
								documentUri : h.util.coreUri.document(item.doc.documentId),
								locationUri : h.util.coreUri.documentLocation(item.doc.documentId,item.doc.lat,item.doc.lon,item.doc.variance),
								lat : item.doc.lat,
								lon : item.doc.lon,
								variance : item.doc.variance,
								upvotes : item.votes.up,
								downvotes : item.votes.down
							});
						}
					}
					

				
					
					var headers = {
							"Content-Type" : "application/vnd.google-earth.kml+xml"
					};
					
					var data = {
						serverName : h.options.server.name,
						serverVersion : h.options.server.version,
						title : h.options.feed.deployment.title,
						
						entries : entries,
						documentId : req.uriParams.documentId
					};
					
					var feed = h.mustache.to_html(template.documentPositions, data)
					
					res.sendArbitrary(200, feed,headers);
					return next();
				}
			});
		},

		getByBbox : function(req, res, next) {
			
			validateBbox(req.params, res, next, function(data){
				
				var lat1 = data.lat1;
				var lat2 = data.lat2;
				var lon1 = data.lon1;
				var lon2 = data.lon2;
				
				
				
				var q = "(" +
					"(lat1<double>:["+lat1+" TO "+lat2+"] OR lat2<double>:["+lat1+" TO "+lat2+"] OR ((lat1<double>:[-90 TO "+lat1+"]) AND (lat2<double>:["+lat2+" TO 90]))) " +
					" AND " +
					"(lon1<double>:["+lon1+" TO "+lon2+"] OR lon2<double>:["+lon1+" TO "+lon2+"] OR ((lon1<double>:[-180 TO "+lon1+"]) AND (lon2<double>:["+lon2+" TO 180]))) " +
				")";
				
				q = "q="+qstring.escape(q); 
				
				
				q = q + "&limit="+h.options.feed.parameters.maxResults;
				
				h.db.fti('docs/docs', q, function(err, dbRes){
					if(err || (dbRes && dbRes.headers && dbRes.headers.status && dbRes.headers.status !== 200)){
						h.responses.error(500,"Internal server error.",res,next);
						return;
					}
					else{
						
						if(dbRes.json.total_rows > h.options.feed.parameters.maxResults){
							h.responses.error(403,"Too much hits ("+dbRes.json.total_rows+"). Please reduce bounding box size.",res,next);
							return;
						}
						
						var entries = []; 
						
						dbRes.forEach(function(item){
							
							entries.push({
								documentId : item.id.substr(2),
								documentUri : h.util.coreUri.document(item.id.substr(2)),
								lat : item.fields.lat1,
								lon : item.fields.lon1,
							});
						});
						
						var headers = {
								"Content-Type" : "application/vnd.google-earth.kml+xml"
						};
						
						var data = {
							serverName : h.options.server.name,
							serverVersion : h.options.server.version,
							title : h.options.feed.deployment.title,
							
							lat1 : lat1,
							lon1 : lon1,
							lat2 : lat2,
							lon2 : lon2,
							
							entries : entries
						};
						
						var feed = h.mustache.to_html(template.bbox, data)
						
						res.sendArbitrary(200, feed,headers);
						return next();

					}
				});
			});
			
		},

		
	};
};
