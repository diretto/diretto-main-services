var barrierpoints = require('barrierpoints');

module.exports = function(db) {
	/*
	 * Callback function(err, { list : [] next? : next previous? : previous etag ? :
	 * etag })
	 */
	var getPage = function(view, cursor, paginationSize, descending, rowExtractor, callback) {
		var result = {
			list : []
		};

		var b = barrierpoints(2, function() {
			callback(null, result);
		});

		// callback(null, {
		// list : ["foo", "bar"],
		// next : "456",
		// previous : "123"
		// });

		// fetch page to result.list
		db.view(view, {
			limit : (paginationSize + 1),
			"descending" : descending,
			startkey : cursor
		}, function(err, dbRes) {
			if (err) {
				b.abort(function() {
					callback(err)
				});
			}
			else {
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
			"descending" : (!descending),
			startkey : cursor
		}, function(err, dbRes) {
			if (dbRes) {
				if (dbRes.rows.length > 1) {
					result['previous'] = rowExtractor(dbRes.rows[dbRes.rows.length - 1]);
				}
			}
			b.submit();
		});
	};

	/**
	 * Forwars to the first page of the paginated view,
	 * since the given date.
	 * callback(err,cursor);
	 * If cursor is also null, there are no items yet. 
	 */
	//???
	var forwardSince = function(viewName, startkey, rowExtractor,  callback) {
		if (Date.parseRFC3339(date) === undefined) {
			callback({
				"error" : {
					"reason" : "Invalid date."
				}
			});
		}
		else {
			db.view(viewName, {
				limit : 1,
				startkey : startkey // [...? ,date]
			}, function(err, dbRes) {
				if (err) {
					callback(err);
				}
				else {
					if (dbRes.rows.length === 0) {
						//nothing so far
						callback(null,null);
					}
					else {
						callback(null,rowExtractor(dbRes.rows[0]));
					}
				}
			});
		}
	};

	/**
	 * Forwars to the first page of the paginated view
	 * callback(err,cursor);
	 * If cursor is also null, there are no items yet. 
	 */
	var forward = function(viewName, rowExtractor, callback) {
		db.view(viewName, {
			limit : 1
		}, function(err,dbRes){
			if(err){
				callback(err);
			}
			else{
				if (dbRes.rows.length === 0) {
					callback(null,null);
				}
				else {
					callback(null,rowExtractor(dbRes.rows[0]));
				}
			}
		});
	};
	
	//TODO: bounded views (start AND endkey)

	return {
		getPage : getPage,
		forwardSince : forwardSince,
		forward : forward
	};
};