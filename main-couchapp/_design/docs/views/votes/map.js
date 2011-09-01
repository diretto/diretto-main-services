function(doc) {
	if(doc.type === "vote"){
	
		if(doc.resourceType === "attachment"){
			emit([doc.resourceType, doc.documentId, doc.attachmentId], doc.vote);
		}
		else if(doc.resourceType === "comment"){
			emit([doc.resourceType, doc.documentId, doc.commentId], doc.vote);
		}
		else if(doc.resourceType === "time"){
			emit([doc.resourceType, doc.documentId, doc.time], doc.vote);
		}
		else if(doc.resourceType === "location"){
			emit([doc.resourceType, doc.documentId, doc.location], doc.vote);
		}
		else if(doc.resourceType === "documenttag"){
			emit([doc.resourceType, doc.documentId, doc.tagId], doc.vote);
		}
		else if(doc.resourceType === "link"){
			//adjust key length by emitting link id twice
			emit([doc.resourceType, doc.linkId, doc.linkId], doc.vote);
		}
		else if(doc.resourceType === "linktag"){
			emit([doc.resourceType, doc.linkId, doc.tagId], doc.vote);
		}

	}
}