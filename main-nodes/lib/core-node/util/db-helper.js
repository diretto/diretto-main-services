module.exports = function(db){
	
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
		db.some({"include_docs" : true},{
			"keys": list.map(function(id){
				return docType.wrap(id);
			}),
			
		},function(err, dbResult){
			if(err){
				callback(err);
			}
			else{
				var result = {};
				//Add db results to object
				dbResult.forEach(function(doc){
					//When a document has not been found, the iterator emits a key, error obj.
					//We set the document to null to reflect that this document is missing
					if(doc.error){
						result[docType.unwrap(doc.key)] = null;
					}
					else{
						result[docType.unwrap(doc._id)] = doc;
					}
				});
				callback(null, result);
			}
		});
	};
	
	return {
		batchFetch : batchFetch			
	}
};