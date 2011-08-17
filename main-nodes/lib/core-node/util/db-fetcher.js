module.exports = function(h) {
	
	var db  = h.db;
	
	var fetchMessage = function(id,callback){
		var docId = h.c.MESSAGE.wrap(id);
		
		db.get(docId, function(err,doc){
			if(err){
				if(err.error  === 'not_found'){
					callback(404);
				}
				else{
					callback(500);
				}
			}
			else{
				callback(null, doc);
			}
		});
	};
	
	
	return {
		fetchMessage : fetchMessage
	};
};