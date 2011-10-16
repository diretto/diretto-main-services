require("rfc3339date");

/**
 * An asynchronous updater for snapshot documents based on changes on:
 *  tags appended, new location, new time, vote for location and vote for time 
 */
module.exports = function(h, eventEmitter) {


	var addTag = function(documentId, tagId){
		h.util.updater.retryable("docs/addtag", h.c.SNAPSHOT.wrap(documentId), {
			tag  : tagId
		}, function(err, result) {
			//ignore
		});
	};
	
	/**
	 * Returns the entry with the best votings, this means the best result of all up-votes minus all down-votes.
	 * If there are multiple entries with the same sum, the oldest one of them will be chosen as top entry.
	 */
	var getTopEntry = function(entries){
		
		var list = [];
		
		for(var idx in entries){
			list.push(entries[idx]);
		}
		
		list.sort(function(a ,b){
			var aVotes = a.votes.up - a.votes.down;
			var bVotes = b.votes.up - b.votes.down;
			
			if(aVotes === bVotes){
				var aTime = Date.parseRFC3339(a.doc.creationTime).getTime();
				var bTime = Date.parseRFC3339(b.doc.creationTime).getTime();
				return (bTime - aTime);
			}
			else{
				return (aVotes - bVotes);
			}
		});
		
		return list[list.length-1];
	}
	

	
	var updateTopTime = function(documentId){
		
		h.util.dbFetcher.fetchDocumentResources(["document",documentId, "time"],function(err, result){
			if(!err && !h.util.empty(result)){
				
				var topEntry = getTopEntry(result[documentId]["time"]);
				
				var update = {
					id : topEntry.doc._id,
					before : topEntry.doc.before,
					after : topEntry.doc.after
				};
				
				h.util.updater.retryable("docs/settime", h.c.SNAPSHOT.wrap(documentId), update, function(err, result) {
					//ignore
				});
			}
		});
		
	};

	var updateTopLocation = function(documentId){
		
		h.util.dbFetcher.fetchDocumentResources(["document",documentId, "location"],function(err, result){
			if(!err && !h.util.empty(result)){
				
				var topEntry = getTopEntry(result[documentId]["location"]);
				
				var update = {
					id : topEntry.doc._id,
					lat : topEntry.doc.lat,
					lon : topEntry.doc.lon,
					variance : topEntry.doc.variance,
				};
				
				h.util.updater.retryable("docs/setlocation", h.c.SNAPSHOT.wrap(documentId), update, function(err, result) {
					//ignore
				});
			}
		});
	};
	
	
	eventEmitter.on("DOCUMENT_TAG_APPENDED", function(event) {
		addTag(event.event.documentId, event.event.tagId);
	});	
	
	eventEmitter.on("VOTE_CASTED", function(event) {
		if(event.event.resourceType === "time"){
			updateTopTime(event.event.resource.documentId);
		}
		else if(event.event.resourceType === "location"){
			updateTopLocation(event.event.resource.documentId);
		}
	});
	
	eventEmitter.on("VOTE_REMOVED", function(event) {
		if(event.event.resourceType === "time"){
			updateTopTime(event.event.resource.documentId);
		}
		else if(event.event.resourceType === "location"){
			updateTopLocation(event.event.resource.documentId);
		}
	});
	
	eventEmitter.on("TIME_ADDED", function(event) {
		updateTopTime(event.event.documentId);
	});
	
	eventEmitter.on("LOCATION_ADDED", function(event) {
		updateTopTime(event.event.documentId);
	});
	
	
	updateTopLocation("1d1b5eb0-cc10-21e0-9572-0800200c9a6c");
};