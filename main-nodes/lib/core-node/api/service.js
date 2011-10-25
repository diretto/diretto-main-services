/**
 * Service Handler
 * 
 * @author Benjamin Erb
 */

module.exports = function(h) {

	var mediatypes = {
			stored : {},
			external : {}
	};
	for(var mime in h.options.mediatypes.stored){
		if (h.options.mediatypes.stored.hasOwnProperty(mime)){
			var item = h.options.mediatypes.stored[mime];
			mediatypes.stored[mime] = {
				type: mime.split("/")[0] || "unknown",
				extension : item.extension,
				maxSize : item.maxSize,
			};
		}
	}
	for(var mime in h.options.mediatypes.external){
		if (h.options.mediatypes.external.hasOwnProperty(mime)){
			var item = h.options.mediatypes.external[mime];
			mediatypes.external[mime] = {
				type: mime.split("/")[0] || "unknown",
				name : item.name
			};
		}
	}
		
		
	return {

		mediatypes : function(req, res, next) {
			res.send(200, {
				"mediatypes": mediatypes
			});
			return next();	
		},
		uuid : function(req, res, next) {
			res.send(200, {
				uuid: h.uuid()
			});
			return next();
		},
		registry : function(req, res, next) {
			if(h.options.registry){
				res.send(200, {
					"services": {
						"list" : h.options.registry 
					}
				});
				return next();				
			}
			else{
				h.responses.error(503,"Registry not yet loaded", res,next);
			}
		}

	};
};