/**
 * Updates the location entry of a snapshot, if changed.
 * 
 * @author Benjamin Erb
 */
function(doc, req) {
	
	//Check for document
	if(!doc || doc.type !== "snapshot"){
		return[null,{code: 404, body:'{"status":404,"error":"not found"}', headers : {"Content-Type":"application/json"} }];
	}
	
	//Parse JSON
	var body = {};
	if(req.body){
		try{
			body  = JSON.parse(req.body);
		}
		catch (e) {
			return[null,{code: 400, body:'{"status":400,"error":"invalid request"}', headers : {"Content-Type":"application/json"} }];
		}
	}
	
	if(body.id && body.lat && body.lon && body.variance){
		
		if(doc.location.id === body.id){
			return[null,{code: 409, body:'{"status":409,"error":"duplicate"}', headers : {"Content-Type":"application/json"} }];
		}
		else{
			doc.location.id = body.id;
			doc.location.lat = body.lat;
			doc.location.lon = body.lon;
			doc.location.variance = body.variance;
			return[doc,{code: 201, body:'{"status":201,"content":{"message":"updated"}}', headers : {"Content-Type":"application/json"} }];
		}

	}	
	else{
		return[null,{code: 400, body:'{"status":400,"error":"invalid request"}', headers : {"Content-Type":"application/json"} }];
	}
	
	
//	
};