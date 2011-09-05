module.exports = function(h) {
	
	var location = function(l){
		return{
			location : {
				   link : h.util.link(h.util.uri.documentLocation(l.doc.documentId, l.doc.lat, l.doc.lon, l.doc.variance)),
				      "position":{
				         "type":"Point",
				         "coordinates":[
				            l.doc.lon,
				            l.doc.lat
				         ]
				      },
				      "variance":l.doc.variance,
				      "creationTime":l.doc.creationTime,
				      "creator":{
				         "link":h.util.link(h.util.uri.user(l.doc.creator)),
				      },
				      "votes":{
				         "link":h.util.link(h.util.uri.documentLocation(l.doc.documentId, l.doc.lat,l.doc.lon,l.doc.variance)+"/votes"),
				         "up":l.votes.up,
				         "down":l.votes.down
				      }
					}
				};
	};
	
	var locationList = function(documentId, locations){
		var list = [];
		for(var idx in locations){
			if(locations.hasOwnProperty(idx)){
				list.push(locations[idx]);
			}
		}
		return {
			"locations" :{
				link : h.util.link(h.util.uri.document(documentId)+"/locations"),
				list : list.map(location)
			}
		};
	};
	
	var time = function(d){
		return{
			   "time":{
				      "link":h.util.link(h.util.uri.documentTime(d.doc.documentId, d.doc.after, d.doc.before)),
				      "between":{
				         "after":d.doc.after,
				         "before":d.doc.before
				      },
				      "creationTime":d.doc.creationTime,
				      "creator":{
					         "link":h.util.link(h.util.uri.user(d.doc.creator)),
					      },
					      "votes":{
						         "link":h.util.link(h.util.uri.documentTime(d.doc.documentId, d.doc.after, d.doc.before)+"/votes"),
						         "up":d.votes.up,
						         "down":d.votes.down
						      }
				   }
				};
	};
	
	var timeList = function(documentId, items){
		var list = [];
		for(var idx in items){
			if(items.hasOwnProperty(idx)){
				list.push(items[idx]);
			}
		}
		return {
			"times" :{
				link : h.util.link(h.util.uri.document(documentId)+"/times"),
				list : list.map(time)
			}
		};
	};
	
	var baseTag = function(doc) {
		return {
			"baseTag" : {
				"link" : h.util.link(h.util.uri.baseTag(doc.baseTagId)),
				"value" : doc.value,
				"creationTime" : doc.creationTime,
				"creator" : {
					"link" : h.util.link(h.util.uri.user(doc.creator))
				}
			}
		}
	};
	
	var tag = function(d, uri){
		return {
			   "tag":{
				      "link":h.util.link(uri),
				      "baseTag" : {
				          "link": h.util.link(h.util.uri.baseTag(d.doc.baseTagId))
				      },
				      "value":d.doc.value,
				      "creationTime":d.doc.creationTime,
				      "creator":{
					         "link":h.util.link(h.util.uri.user(d.doc.creator)),
				      },
				      "votes":{
				    	  "link":h.util.link(uri+"/votes"),
				    	  "up":d.votes.up,
					         "down":d.votes.down
				      }
				   }
				};
	};
	
	var documentTag = function(d){
		return tag(d, h.util.uri.documentTag(d.doc.documentId, d.doc.baseTagId));
	};
	
	var documentTagList = function(documentId, items){
		var list = [];
		for(var idx in items){
			if(items.hasOwnProperty(idx)){
				list.push(items[idx]);
			}
		}
		return {
			"tags" :{
				link : h.util.link(h.util.uri.document(documentId)+"/tags"),
				list : list.map(documentTag)
			}
		};
	};
	
	var linkTag = function(d){
		return tag(d, h.util.uri.linkTag(d.doc.linkId, d.doc.baseTagId));
	};
	
	var linkTagList = function(linkId, items){
		var list = [];
		for(var idx in items){
			if(items.hasOwnProperty(idx)){
				list.push(items[idx]);
			}
		}
		return {
			"tags" :{
				link : h.util.link(h.util.uri.link(linkId)+"/tags"),
				list : list.map(linkTag)
			}
		};
	};
	
	
	var comment = function(d){
		return {
			   "comment":{
				      "link":h.util.link(h.util.uri.comment(d.doc.documentId,d.doc.commentId)),
				      "content":d.doc.content,
				      "creationTime":d.doc.creationTime,
				      "creator":{
					         "link":h.util.link(h.util.uri.user(d.doc.creator)),
				      },
				      "votes":{
					         "link":h.util.link(h.util.uri.comment(d.doc.documentId,d.doc.commentId)+"/votes"),
					         "up":d.votes.up,
					         "down":d.votes.down
				      }
				   }
				};
	};
	
	var link = function(d){
		
		var linkId;
		for(var idx in d.link){
			if(d.link.hasOwnProperty(idx)){
				linkId = idx;
			}
		}
		var linkDoc = d["link"][linkId];
		
		var result = {
		   "documentLink":{
			      "link":h.util.link(h.util.uri.link(linkDoc.doc.linkId)),
			      "title":linkDoc.doc.title,
			      "description":linkDoc.doc.description,
			      "creationTime":linkDoc.doc.creationTime,
			      "creator":{
				         "link":h.util.link(h.util.uri.user(linkDoc.doc.creator)),
			      },			      
			      "source":{
			         "document":{
				         "link":h.util.link(h.util.uri.document(linkDoc.doc.source.documentId)),
				      }
			      },
			      "destination":{
			         "document":{
				         "link":h.util.link(h.util.uri.document(linkDoc.doc.destination.documentId)),
				      },
			      },
			      "votes":{
				         "link":h.util.link(h.util.uri.link(linkDoc.doc.linkId)+"/votes"),
				         "up":linkDoc.votes.up,
				         "down":linkDoc.votes.down
			      },
			      "tags":{
			    	  "link":h.util.link(h.util.uri.link(linkDoc.doc.linkId)+"/tags"),
			         "list":[]
			      }
			   }
		};
		for(var idx in d.tag){
			if(d.tag.hasOwnProperty(idx)){
				result.documentLink.tags.list.push(linkTag(d["tag"][idx]));
			}
		}
		return result;
	};
	
	var attachment = function(d){
		var result = {
		   "attachment":{
			      "link":h.util.link(h.util.uri.attachment(d.doc.documentId,d.doc.attachmentId)),
			      "title":d.doc.title,
			      "description":d.doc.description,
			      "publishedTime":d.doc.publishedTime,
			      "publisher":{
			         "link":h.util.link(h.util.uri.user(d.doc.publisher)),
			      },
			      "mimeType":d.doc.mimeType,					      
			      "votes":{
				      "link":h.util.link(h.util.uri.attachment(d.doc.documentId,d.doc.attachmentId)+"/votes"),
				      "up":d.votes.up,
			         "down":d.votes.down
			      },
			      "license":"Creative Commons Attribution-ShareAlike 3.0 Unported - Deed",
			      "contributors":[],
			      "creators":[]
			   }
			};
		if(d.doc.external){
			result.attachment.external = d.doc.external; 
		}
		else if(d.doc.fileSize){
			result.attachment.file = {
				size : 	d.doc.fileSize,
				link : h.util.link(""+h.options.common.endpoints.storage + "/" + d.doc.documentId + "/" + d.doc.attachmentId + "." + h.options.mediatypes.stored[d.doc.mimeType].extension)
			} ;
		}

		["creators","contributors"].forEach(function(c){
			["external","user"].forEach(function(t){
				d.doc[c][t].forEach(function(p){
					if(t === "external"){
						var entry = {
								"external" : {
									name : p.name,
									link : null
								}
							};
						if(p.link !== null){
							entry["external"]["link"] = h.util.link(p.link);
						}
						result.attachment[c].push(entry);
					}
					else{
						result.attachment[c].push({
							"user" : {
								link : h.util.link(h.util.uri.user(p))
							}
						});
					}
				});			
			});
		});
	
		return result;
	};
	
	var attachmentList = function(documentId, items){
		var list = [];
		for(var idx in items){
			if(items.hasOwnProperty(idx)){
				list.push(items[idx]);
			}
		}
		return {
			"attachments" :{
				link : h.util.link(h.util.uri.document(documentId)+"/attachments"),
				list : list.map(attachment)
			}
		};
	};
	
	var keyvalue = function(d){
		return {
            "link": h.util.link(h.util.uri.keyvalue(d.doc.documentId, d.doc.userId, d.doc.key)),
             "key":{
                "namespace":d.doc.userId,
                "field":d.doc.key
             },
             "value":d.doc.value
          }
	}
	
	var documentMeta = function(d){
		
		var documentId;
		for(var idx in d.document){
			if(d.document.hasOwnProperty(idx)){
				documentId = idx;
			}
		}
		var item = d["document"][documentId];
		
		var docUri = h.util.uri.document(documentId)
		
		var result = {
			"document":{
		      "link":h.util.link(docUri),
		      "mediaType":item.doc.mediaType,
		      "publishedTime":item.doc.publishedTime,
		      "publisher":{
			         "link":h.util.link(h.util.uri.user(item.doc.publisher)),
			      },
		      "title":item.doc.title,
		      "description":item.doc.description,
		      "comments":{
			      "link":h.util.link(docUri+"/comments"),
		      },
		      "tags":{
			      "link":h.util.link(docUri+"/tags"),
		      },
		      "attachments":{
			      "link":h.util.link(docUri+"/attachments"),
		      },
		      "locations":{
			      "link":h.util.link(docUri+"/locations"),
		      },
		      "times":{
			      "link":h.util.link(docUri+"/times"),
		      },
		      "values":{
			      "link":h.util.link(docUri+"/values"),
		      },
		      "documentLinks":{
			      "link":h.util.link(docUri+"/links"),
		      }
		   }
		};
		return result;
	};
	
	var documentFull = function(d,l){
		var documentId;
		for(var idx in d.document){
			if(d.document.hasOwnProperty(idx)){
				documentId = idx;
			}
		}
		var item = d["document"][documentId];
		
		var docUri = h.util.uri.document(documentId)
		
		var result = {
			"document":{
		      "link":h.util.link(docUri),
		      "mediaType":item.doc.mediaType,
		      "publishedTime":item.doc.publishedTime,
		      "publisher":{
			         "link":h.util.link(h.util.uri.user(item.doc.publisher)),
			      },
		      "title":item.doc.title,
		      "description":item.doc.description,
		      "comments":{
			      "link":h.util.link(docUri+"/comments"),
			      "list" : [] 
		      },
		      "tags":{
			      "link":h.util.link(docUri+"/tags"),
			      "list" : [] 
		      },
		      "attachments":{
			      "link":h.util.link(docUri+"/attachments"),
			      "list" : [] 
		      },
		      "locations":{
			      "link":h.util.link(docUri+"/locations"),
			      "list" : [] 
		      },
		      "times":{
			      "link":h.util.link(docUri+"/times"),
			      "list" : [] 
		      },
		      "values":{
			      "link":h.util.link(docUri+"/values"),
			      "list" : [] 
		      },
		      "documentLinks":{
			      "link":h.util.link(docUri+"/links"),
			      "in" : [], 
			      "out" : [] 
		      }
		   }
		};
		
		for(var idx in d.tag){
			if(d.tag.hasOwnProperty(idx)){
				result.document.tags.list.push(documentTag(d["tag"][idx]));
			}
		}
		for(var idx in d.attachment){
			if(d.attachment.hasOwnProperty(idx)){
				result.document.attachments.list.push(attachment(d["attachment"][idx]));
			}
		}
		for(var idx in d.comment){
			if(d.comment.hasOwnProperty(idx)){
				result.document.comments.list.push(comment(d["comment"][idx]));
			}
		}
		for(var idx in d.time){
			if(d.time.hasOwnProperty(idx)){
				result.document.times.list.push(time(d["time"][idx]));
			}
		}
		for(var idx in d.location){
			if(d.location.hasOwnProperty(idx)){
				result.document.locations.list.push(location(d["location"][idx]));
			}
		}
		for(var idx in d.keyvalue){
			if(d.keyvalue.hasOwnProperty(idx)){
				result.document.values.list.push(keyvalue(d["keyvalue"][idx]));
			}
		}	
		
		//inject links
		for(var idx in l){
			if(l.hasOwnProperty(idx)){
				var linkItem = l[idx]["link"][idx];
				
				if(linkItem.doc.source.documentId === documentId){
					result.document.documentLinks.out.push(link(l[idx]));
				}
				else if(linkItem.doc.destination.documentId === documentId){
					result.document.documentLinks["in"].push(link(l[idx]));
				}
			}
		}		
		return result;
	};
	
	var documentSnapshot = function(d){
		
		var documentId;
		for(var idx in d.document){
			if(d.document.hasOwnProperty(idx)){
				documentId = idx;
			}
		}
		var item = d["document"][documentId];
		
		var docUri = h.util.uri.document(documentId)
		
		var result = {
			"document":{
		      "link":h.util.link(docUri),
		      "mediaType":item.doc.mediaType,
		      "publishedTime":item.doc.publishedTime,
		      "publisher":{
			         "link":h.util.link(h.util.uri.user(item.doc.publisher)),
			      },
		      "title":item.doc.title,
		      "description":item.doc.description,
		      "comments":{
			      "link":h.util.link(docUri+"/comments"),
		      },
		      "tags":{
			      "link":h.util.link(docUri+"/tags"),
			      "list" : []
		      },
		      "attachments":{
			      "link":h.util.link(docUri+"/attachments"),
		      },
		      "locations":{
			      "link":h.util.link(docUri+"/locations"),
		      },
		      "times":{
			      "link":h.util.link(docUri+"/times"),
		      },
		      "values":{
			      "link":h.util.link(docUri+"/values"),
		      },
		      "documentLinks":{
			      "link":h.util.link(docUri+"/links"),
		      }
		   }
		};
		
		for(var idx in d.tag){
			if(d.tag.hasOwnProperty(idx)){
				result.document.tags.list.push(documentTag(d["tag"][idx]));
			}
		}
		
		var attachmentId = null;
		for(var idx in d.attachment){
			if(d.attachment.hasOwnProperty(idx)){
				attachmentId = idx;
			}
		}		
		var locationId = null;
		for(var idx in d.location){
			if(d.location.hasOwnProperty(idx)){
				locationId = idx;
			}
		}		
		var timeId = null;
		for(var idx in d.time){
			if(d.time.hasOwnProperty(idx)){
				timeId = idx;
			}
		}
		

		result.document.snapshot = {};
		if(attachmentId && d.attachment[attachmentId]){
			result.document.snapshot.attachment = attachment(d.attachment[attachmentId]).attachment;
		}
		if(timeId && d.time[timeId]){
			result.document.snapshot.time = time(d.time[timeId]).time;
		}
		if(locationId && d.location[locationId]){
			result.document.snapshot.location = location(d.location[locationId]).location;
		}
		return result;
	};
	
	return {
		baseTag : baseTag,
		
		location : location,
		locationList : locationList,
		
		time : time,
		timeList : timeList,
		
		documentTag : documentTag,
		documentTagList : documentTagList,
		
		linkTag : linkTag,
		linkTagList : linkTagList,
		
		comment : comment,
		
		link : link,
		
		attachment : attachment,
		attachmentList : attachmentList,
		
		documentMeta : documentMeta,
		documentFull : documentFull,
		documentSnapshot : documentSnapshot
	};
};