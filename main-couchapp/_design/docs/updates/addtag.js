/**
 * Adds a tag to the snapshot document
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
	
	
	if(body.tag){
		
		doc.tags.forEach(function(tag){
			if(tag === body.tag){
				return[null,{code: 409, body:'{"status":409,"error":"duplicate"}', headers : {"Content-Type":"application/json"} }];
			}
		});
		
		doc.tags.push(body.tag);
		return[doc,{code: 201, body:'{"status":201,"content":{"message":"updated"}}', headers : {"Content-Type":"application/json"} }];
	}	
	else{
		return[null,{code: 400, body:'{"status":400,"error":"invalid request"}', headers : {"Content-Type":"application/json"} }];
	}
	
	
//	
};