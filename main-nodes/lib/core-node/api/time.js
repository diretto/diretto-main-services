require("rfc3339date");

module.exports = function(h) {

	
	var renderTime = function(doc){
		return {
			
		};
	};
	
	return {

		
		create : function(req, res, next) {
			var dateRange = req.uriParams.time;
			var dates = dateRange.split("--");
			
			var documentId = req.uriParams.documentId;
			
			if(dates.length !== 2 || !h.util.commonValidator.validateDate(dates[0]) || !h.util.commonValidator.validateDate(dates[1])){
				h.responses.error(400,"Invalid time range.",res,next);
				return;
			}
			
			var before, after;
			if(Date.parseRFC3339(dates[0]).getTime() > Date.parseRFC3339(dates[1]).getTime()){
				after = dates[1];
				before =  dates[0];
			}
			else{
				before = dates[1];
				after =  dates[0];
			}
			
			var timeDoc = {
					_id : h.c.TIME.wrap(h.util.dbHelper.concat(documentId, h.util.dbHelper.createTimeId(before, after))),
					type : h.c.TIME.TYPE,
					documentId : documentId,
					creator : req.authenticatedUser,
					creationTime : new Date().toRFC3339UTCString(),
					before : before,
					after : after,
			};
			
			console.log(timeDoc._id);
			
			// doc exists
			h.util.dbFetcher.exist(documentId, h.c.DOCUMENT, function(code){
				if(code === 200){
					//Time suggestion already existing?
					h.util.dbFetcher.exist(h.util.dbHelper.concat(documentId, h.util.dbHelper.createTimeId(before, after)), h.c.TIME, function(code){
						if(code === 200){
							h.responses.error(409,"Time suggestion already exists.",res,next);
							return;
							
						}
						else if(code === 404){
							h.db.save(timeDoc._id, timeDoc, function(err, dbRes) {
								if (err) {
									h.responses.error(500,"Internal server error. Please try again later.",res,next);
								}
								else {
									res.send(202, {
										"link" : h.util.link(h.util.uri.documentTime(documentId,after,before))
									}, {
										'Location' : h.util.uri.documentTime(documentId,after,before)
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
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId, "time", req.uriParams.time],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					h.responses.error(404,"Time not found.",res,next);
				}
				else{
					res.send(200, h.util.renderer.time(result[req.uriParams.documentId]["time"][req.uriParams.time]));
					return next();
				}
			});
		},
		
		getAll : function(req, res, next) {
			h.util.dbFetcher.fetchDocumentResources(["document",req.uriParams.documentId, "time"],function(err, result){
				if(err){
					h.responses.error(500,"Internal server error.",res,next);
				}
				else if(h.util.empty(result)){
					//empty result, so check if document exists at all
					h.util.dbFetcher.exist(req.uriParams.documentId, h.c.DOCUMENT, function(code){
						if(code === 200){
							res.send(200, h.util.renderer.timeList(req.uriParams.documentId,{}));
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
					res.send(200, h.util.renderer.timeList(req.uriParams.documentId,result[req.uriParams.documentId]["time"]));
					return next();
				}
			});
		}
		

		
		
	};
};