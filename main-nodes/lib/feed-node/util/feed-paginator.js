require("rfc3339date");
var barrierpoints = require('barrierpoints');

module.exports = function(db) {
	/**
	 * Returns a page of the given size from the view, using the cursor and the range key for restricting results.
	 * 
	 * This calls the CouchDB view twice and in parallel, in order to get the current page, but also
	 * cursors for the previous page.  
	 * 
	 * Callback function(err, { list : [] next? : next previous? : previous etag ? :
	 * etag })
	 */
	var getPage = function(view, cursor, rangeKey, paginationSize, descending, includeDocs, rowExtractor, callback) {
		var result = {
			list : []
		};

		var b = barrierpoints(2, function() {
			callback(null, result);
		});

		var endKey = (rangeKey || []).slice(0);
//		endKey.push({});
		

		var startKey = cursor;
		

		
		// fetch page to result.list
		db.view(view, {
			limit : (paginationSize + 1),
			"descending" : !!descending,
			startkey : startKey,
			endkey : endKey,
			include_docs : !!includeDocs
		}, function(err, dbRes) {
			if (err) {
				b.abort(function() {
					callback(err)
				});
			}
			else {
				
//				console.dir(dbRes);
				
				if (dbRes.length > 0) {
					var i = 0;
					for (; i < paginationSize && i < dbRes.rows.length; i++) {
						result.list.push(rowExtractor(dbRes.rows[i]));
					}
				}
				// fetch next to result.next, when existing
				if (i === paginationSize && dbRes.rows[i]) {
					result['next'] = rowExtractor(dbRes.rows[i]);
				}
				b.submit();
			}
		});

		// fetch previous to result.previous, when existing
		db.view(view, {
			limit : (paginationSize + 1),
			"descending" : !(!!descending),
			startkey : cursor
		}, function(err, dbRes) {
			if (dbRes) {
				
				var compareRange = function(entry){
					var equal = true;
					for(var i = 0;i<rangeKey.length && equal;i++){
						equal = (entry && entry[i] && entry[i] === rangeKey[i]);
					}
					return equal;
				};
				
				//first entry (0) is current doc
				if (dbRes.rows.length > 1) {
					//check if really in range, we might have crossed view collation border.
					var previousIdx = -1;
					var inRange = true;
					for (var i = 1; i <  dbRes.rows.length && inRange; i++) {
						if(compareRange(dbRes.rows[i].key)){
							previousIdx = i;
						}
						else{
							inRange = false;
						}
					}
					if(previousIdx !== -1){
						result['previous'] = rowExtractor(dbRes.rows[previousIdx]);
					}
				}
			}
			b.submit();
		});
	};


	
	return {
		getPage : getPage,
	};
};