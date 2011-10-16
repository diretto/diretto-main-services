require("rfc3339date");

module.exports = function(h) {

	return {

		create : function(req, res, next) {
			var location = req.uriParams.location;
			var locParts = location.split(",");
			
			var documentId = req.uriParams.documentId;
			
			if(locParts.length !== 3 || !h.util.commonValidator.validateLocationValues(locParts[0],locParts[1],locParts[2])){
				h.responses.error(400,"Invalid location.",res,next);
				return;
			}

			var lat = locParts[0];
			var lon = locParts[1];
			var variance = locParts[2];

			var locationDoc = {
					_id : h.c.LOCATION.wrap(h.util.dbHelper.concat(documentId, h.util.dbHelper.createLocationId(lat,lon,variance))),
					type : h.c.LOCATION.TYPE,
					documentId : documentId,
					creator : req.authenticatedUser,
					creationTime : new Date().toRFC3339UTCString(),
					lat : lat,
					lon : lon,
					variance : variance
			};
			
			// doc exists
			h.util.dbFetcher.exist(documentId, h.c.DOCUMENT, function(code){
				if(code === 200){
					//Location suggestion already existing?
					h.util.dbFetcher.exist(h.util.dbHelper.concat(documentId, h.util.dbHelper.createLocationId(lat,lon,variance)), h.c.LOCATION, function(code){
						if(code === 200){
							h.responses.error(409,"Location suggestion already exists.",res,next);
							return;
							
						}
						else if(code === 404){
							h.db.save(locationDoc._id, locationDoc, function(err, dbRes) {
								if (err) {
									h.responses.error(500,"Internal server error. Please try again later.",res,next);
								}
								else {
									res.send(202, {
										"link" : h.util.link(h.util.uri.documentLocation(documentId,lat,lon,variance))
									}, {
										'Location' : h.util.uri.documentLocation(documentId,lat,lon,variance)
									});
									
									h.util.events.locationAdded({
										userId : req.authenticatedUser,
										documentId : documentId,
										lat : lat,
										lon : lon,
										variance : variance,
										id : locationDoc._id
									});
									
									
									return next();
								}
							});
						}
						else{
							h.responses.error(500,"Internal server error.",res,next);
							return;
						}
					});
				}
				else if(code === 404){
					h.responses.error(404,"Document not found.",res,next);
					return;
				}
				else{
					h.responses.error(500,"Internal server error.",res,next);
					return;

				}
			});

		},
		get : function(req, res, next) {
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId, "location", req.uriParams.location],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					h.responses.error(404,"Location not found.",res,next);
				}
				else{
					res.send(200, h.util.renderer.location(result[req.uriParams.documentId]["location"][req.uriParams.location]));
					return next();
				}
			});
		},
		
		getAll : function(req, res, next) {
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
					res.send(200, h.util.renderer.locationList(req.uriParams.documentId,result[req.uriParams.documentId]["location"]));
					return next();
				}
			});
		}
		

	};
};