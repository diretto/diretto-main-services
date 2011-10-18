/**
 * Complex fti index for lucene queries.
 * 
 * Allows to search by publish time, spatial/temporal origin and tags.  
 * 
 * @author Benjamin Erb
 */

function (doc) {
	
	var debug = true;
	// !code ../vendor/diretto/rfc3339.js
	
	var store = (debug ? "yes" : "no");
	
	
	if(doc.type && doc.type  === 'snapshot' && doc.enabled && !!doc.enabled){
	
		var ret=new Document();
		
		
		//publish time
		ret.add(parseRFC3339(doc.creationTime).getTime(), {"field":"publishedTime","type":"long", "store": store});
		
		//time range of creation
		ret.add(parseRFC3339(doc.time.after).getTime(), {"field":"after","type":"long", "store": store});
		ret.add(parseRFC3339(doc.time.before).getTime(), {"field":"before","type":"long", "store": store});

		//lon, lat
		//TODO: use variance value to 
		ret.add(doc.location.lon, {"field":"lon1","type":"double", "store": store});
		ret.add(doc.location.lat, {"field":"lat1","type":"double", "store": store});
		ret.add(doc.location.lon, {"field":"lon2","type":"double", "store": store});
		ret.add(doc.location.lat, {"field":"lat2","type":"double", "store": store});
		
		//Tags
		if(doc.tags){
			doc.tags.forEach(function(tag){
				  ret.add(tag,{"field":"tags","type":"string", "store": store});
			});
		 }		
		
		return ret; 
	}
};
