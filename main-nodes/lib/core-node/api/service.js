module.exports = function(h) {

	return {

		mediatypes : function(req, res, next) {
			res.send(501);
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