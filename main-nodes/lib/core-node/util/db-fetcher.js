/**
 * Helper functions for common database requests. 
 * 
 * @author Benjamin Erb
 */

var barrierpoints = require('barrierpoints');

module.exports = function(h) {
	
	var db  = h.db;
	
	/**
	 * Takes a list of diretto resource IDs, their document type and fetches all
	 * of them in a single result, yielding an object literal of resource ID =>
	 * couchDB documents. The document type is needed for converting diretto IDs
	 * to CouchDB doc IDs and vice versa.
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
				// Add db results to object
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
	
	var fetchViewDoc = function(key, viewName, callback){
		h.db.view(viewName, {
			limit : 1,
			key : key,
			include_docs : true
		}, function(err, dbRes) {
			if (dbRes && dbRes.length === 1) {
				callback(null, dbRes[0].doc);
			}
			else if (dbRes) {
				callback(404);
			}
			else {
				callback(500);
			}
		});
	};
	
	
	var fetchLatestViewRow = function(include, descending, viewName, callback){
		h.db.view(viewName, {
			limit : 1,
			include_docs : !!include,
			descending : !!descending
		}, function(err, dbRes) {
			if (dbRes && dbRes.length === 1) {
				callback(null, dbRes[0]);
			}
			else if (dbRes) {
				callback(404);
			}
			else {
				callback(500);
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
	
	var viewKeyExists = function(view, key, callback){
		h.db.view(view, {
			limit : 1,
			key : key,
		}, function(err, dbRes) {
			if (dbRes && dbRes.length === 1) {
				callback(null, true);
			}
			else if (dbRes) {
				callback(null, false);
			}
			else {
				callback(err);
			}
		});
	};
	
	var fetchVotes = function(resourceKey, callback){
		h.db.view('docs/votes', {
			limit : 1,
			key : resourceKey,
			reduce : true,
			group_level : resourceKey.length
		}, function(err, dbRes) {
			if (dbRes && dbRes.length === 1) {
				var count = dbRes[0].value.count;
				var sum = dbRes[0].value.sum;
				
				var base = (count - Math.abs(sum)) / 2;
				var up = base + (sum > 0 ? sum : 0);
				var down = base + (sum < 0 ? Math.abs(sum) : 0);
				
				callback(null, {
					up : up,
					down : down
				});
			}
			else if (dbRes) {
				callback(null, null);
			}
			else {
				callback(err);
			}
		});
	};
	
	var fetchComplexResources = function(complexView, rangeKey, callback){
		//fetch complex doc
		//fetch votes
		
		var startKey = (rangeKey || []).slice(0);
		
		var endKey = (rangeKey || []).slice(0);
		endKey.push({});
		
		var votes = {};
		var docs = {};
		
		var b = barrierpoints(2, function() {
			
			//iterate over docs, add vote if available, or empty vote set
			var result = {};
			for(var idx in docs){
				if(docs.hasOwnProperty(idx)){
					var key = idx.split(","); 
					
					//fix for last key parts containing ","
					if(key.length > 4){
						var last = key.slice(3); 
						key[3] = last.join(",");
					}
					
					//create deep structure
					if(!result[key[1]]){
						result[key[1]] = {};
					}
					if(!result[key[1]][key[2]]){
						result[key[1]][key[2]] = {};
					}
					if(!result[key[1]][key[2]][key[3]]){
						result[key[1]][key[2]][key[3]] = {};
					}
					
					result[key[1]][key[2]][key[3]]['doc'] = docs[idx];
					result[key[1]][key[2]][key[3]]['votes'] = votes[idx] || { up : 0, down : 0};
				}
			}
			callback(null, result);
		});
		
		
		h.db.view(complexView, {
			startkey : startKey,
			endkey : endKey,
			include_docs : true
		}, function(err, dbRes) {
			if(err){
				b.abort(function(){
					callback(err);
				});
			}
			else{
				dbRes.forEach(function(key, row){
					docs[key] = row;
				});
				b.submit();
			}
		});
		
		
		h.db.view('docs/votes', {
			startkey : startKey,
			endkey : endKey,
			reduce : true,
			group_level : 4
		}, function(err, dbRes) {
			if(err){
				b.abort(function(){
					callback(err);
				});
			}
			else{
				dbRes.forEach(function(key, row){
					
					var count = row.count;
					var sum = row.sum;
					
					var base = (count - Math.abs(sum)) / 2;
					var up = base + (sum > 0 ? sum : 0);
					var down = base + (sum < 0 ? Math.abs(sum) : 0);
					
					votes[key] = {
							up : up,
							down : down
					};
				});
				b.submit();
			}
		});	
	};
	
	
	var fetchDocumentResources = function(rangeKey, callback){
		fetchComplexResources('docs/complex_docs',rangeKey, callback);
	};	
	
	var fetchLinkResources = function(rangeKey, callback){
		fetchComplexResources('docs/complex_links',rangeKey, callback);
	};	
	
	var fetchComplexResourcesByKey = function(complexView, keys, callback){
		//fetch complex doc
		//fetch votes
		
		var votes = {};
		var docs = {};
		
		var b = barrierpoints(2, function() {
			
			
			//iterate over docs, add vote if available, or empty vote set
			var result = {};
			for(var idx in docs){
				if(docs.hasOwnProperty(idx)){
					var key = idx.split(","); 
					
					//fix for last key parts containing ","
					if(key.length > 4){
						var last = key.slice(3); 
						key[3] = last.join(",");
					}
					
					//create deep structure
					if(!result[key[1]]){
						result[key[1]] = {};
					}
					if(!result[key[1]][key[2]]){
						result[key[1]][key[2]] = {};
					}
					if(!result[key[1]][key[2]][key[3]]){
						result[key[1]][key[2]][key[3]] = {};
					}
					
					result[key[1]][key[2]][key[3]]['doc'] = docs[idx];
					result[key[1]][key[2]][key[3]]['votes'] = votes[idx] || { up : 0, down : 0};
				}
			}
			callback(null, result);
		});
		
		
		h.db.view(complexView, {
			keys : keys,
			include_docs : true
		}, function(err, dbRes) {
			if(err){
				b.abort(function(){
					callback(err);
				});
			}
			else{
				dbRes.forEach(function(key, row){
					docs[key] = row;
				});
				b.submit();
			}
		});
		
		
		h.db.view('docs/votes', {
			keys : keys,
			reduce : true,
			group_level : 4,
			group: true
		}, function(err, dbRes) {
			if(err){
				b.abort(function(){
					callback(err);
				});
			}
			else{
				dbRes.forEach(function(key, row){
					
					var count = row.count;
					var sum = row.sum;
					
					var base = (count - Math.abs(sum)) / 2;
					var up = base + (sum > 0 ? sum : 0);
					var down = base + (sum < 0 ? Math.abs(sum) : 0);
					
					votes[key] = {
						up : up,
						down : down
					};
				});
				b.submit();
			}
		});	
	};
	
	var fetchDocumentResourcesByKey = function(keys, callback){
		fetchComplexResourcesByKey('docs/complex_docs',keys, callback);
	};	
	
	var fetchLinkResourcesByKey = function(keys, callback){
		fetchComplexResourcesByKey('docs/complex_links',keys, callback);
	};
	
	
	var fetchMultipleResources = function(list, flatView, complexView, callback){
		
		var keys = [];
		
		h.db.view(flatView, {
			keys : list
		}, function(err, dbRes) {
			if(err){
			}
			else{
				dbRes.forEach(function(key, row){
					keys.push(row);
				});
			}
			fetchComplexResourcesByKey(complexView, keys,callback);
		});	
		
	};
	
	var fetchMultipleDocsById = function(list, callback){
		fetchMultipleResources(list, 'docs/flat_docs','docs/complex_docs', callback);
	};
	
	var fetchMultipleLinksById = function(list, callback){
		fetchMultipleResources(list, 'docs/flat_links','docs/complex_links', callback);
	};

	var fetchMultipleDocSnapshotsById = function(list, callback){
		fetchMultipleResources(list, 'docs/flat_snapshots','docs/complex_docs', callback);
	};
	

	return {
		batchFetch : batchFetch,
		fetch : fetch,
		exist : exist,
		
		fetchViewDoc : fetchViewDoc,
		fetchLatestViewRow : fetchLatestViewRow,
		
		viewKeyExists : viewKeyExists,
		
		fetchVotes : fetchVotes,
		
		fetchDocumentResources : fetchDocumentResources,
		fetchLinkResources : fetchLinkResources,
		
		fetchDocumentResourcesByKey : fetchDocumentResourcesByKey,
		fetchLinkResourcesByKey : fetchLinkResourcesByKey,
		
		fetchMultipleDocsById : fetchMultipleDocsById,
		fetchMultipleLinksById : fetchMultipleLinksById,
		fetchMultipleDocSnapshotsById : fetchMultipleDocSnapshotsById,
		
	};
};