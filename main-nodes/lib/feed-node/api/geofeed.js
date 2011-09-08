var fs = require('fs');
var path = require('path');

module.exports = function(h) {
	
	//load all templates on init, blocking calls do not interfere here
	var template = {
			bbox : fs.readFileSync(path.join(__dirname, "..","templates","bbox.kml" ),"utf-8"),	
			documentPositions : fs.readFileSync(path.join(__dirname, "..","templates","documentpositions.kml" ),"utf-8"),	
			latestDocs : fs.readFileSync(path.join(__dirname, "..","templates","latestdocs.kml" ),"utf-8")	
	};
	

	return {
		
		getByBbox : function(req, res, next) {
			res.send(501);
			return next();
		},

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
			res.send(501);
			return next();
		}

	};
};
