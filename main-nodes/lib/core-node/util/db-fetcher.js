module.exports = function(h) {
	
	var db  = h.db;
	
	/**
	 * Takes a list of diretto resource IDs, their document type and 
	 * fetches all of them in a single result, yielding an object literal of 
	 * resource ID => couchDB documents. 
	 * The document type is needed for converting diretto IDs to CouchDB doc IDs
	 * and vice versa.
	 * 
	 * Callback: function(err, resultObj);
	 */
	var batchFetch = function(list, docType, callback){
//		console.dir(list);
		db.some({"include_docs" : true},{
			"keys": list.map(function(id){
				return docType.wrap(id);
			}),
			
		},function(err, dbResult){
//			console.dir(dbResult);
			if(err){
				callback(err);
			}
			else{
				var result = {};
				//Add db results to object
				for(var i = 0;i<dbResult.length;i++){
					var row = dbResult[i];
					result[docType.unwrap(row.key)] = row.doc || null;
				}
				callback(null, result);
			}
		});
	};
	
	var fetch = function(id, type, callback){
		db.get(type.wrap(id), function(err,doc){
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
	
	var exist = function(id, type, callback){
		h.db.head(type.wrap(id), function(err, headers,code) {
			if(code && code === 404){
				callback(404);
			}
			else if(code && code === 200){
				callback(200);
			}
			else {
				callback(500);
			}
		});
	};
	
	var fetchVotes = function(){
		
	};
	
	return {
		batchFetch : batchFetch,
		fetch : fetch,
		exist : exist,
		
		fetchVotes : fetchVotes
	};
};