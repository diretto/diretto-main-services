module.exports = function(h) {
	
	var db = h.db;

	var isRetryable = function(err) {
		if(err && err.error === 'conflict'){
			return true;	
		}
		else{
			return false;
		}
	};
	
	
	//Wrapper that work-arounds https://issues.apache.org/jira/browse/COUCHDB-648 as well as missing response code from db client
	//When response code is ok, but X-Response-Code is a valid header, or the document contains this value, emit error.
	var request = function(path, id, data, callback){
		db.update(path, id, null, data, function(err,dbRes){
			if(err){
				callback(err);
			}
			else{
				callback(null, dbRes);
			}
		});
	};
	
	var retryingUpdateHandler = function retryingUpdateHandler(path, id, data, callback, attempts, factors, backoff) {
		if (attempts >= 1) {
			request(path, id, data, function(err, result) {
				if (err) {
					if(attempts <= 1){
						callback(err);
					}
					else{
						if (isRetryable(err)) {
							var nextBackoff = Math.floor(factors * backoff + (Math.random()*backoff));
							console.log("RETRYING in "+nextBackoff);
							setTimeout(function() {
								retryingUpdateHandler(path, id, data, callback, attempts - 1, factors, nextBackoff);
							}, nextBackoff);
						}
						else {
							callback(err);
						}
					}
				}
				else {
					callback(err, result)
				}
			});
		}
		else {
			callback({'error':"all attempts failed"});
		}

	};

	return {
		retryable : function(path, id, data, callback) {
			return retryingUpdateHandler(path, id, data, callback, 6, 1.1, 80);
		}
	}

};