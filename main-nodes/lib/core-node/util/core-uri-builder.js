/**
 * A helper object that generates resource URIs using the v2 URI templates.
 */
module.exports = function(baseUri){
	
	var builder = function(p){
		
//		console.dir(p);
		
		if(p.documentId && p.commentId){
			return  baseUri+"/document/"+p.documentId+"/comment/"+p.commentId;
		}		
		else if(p.userId && p.collectionId && p.documentId){
			return  baseUri+"/user/"+p.userId+"/collection/"+p.collectionId+"/document/"+p.documentId;
		}
		else if(p.documentId && p.tagId){
			return  baseUri+"/document/"+p.documentId+"/tag/"+p.tagId;;
		}
		else if(p.linkId && p.tagId){
			return  baseUri+"/link/"+p.linkId+"/tag/"+p.tagId;;
		}
		else if(p.userId && p.collectionId && p.cursorId){
			return  baseUri+"/user/"+p.userId+"/collection/"+p.collectionId+"/documents/cursor/"+p.cursorId;
		}
		else if(p.documentId && p.userId && p.key){
			return  baseUri+"/document/"+p.documentId+"/value/"+p.userId+"/"+p.key;
		}
		else if(p.documentId && p.commentPageCursorId){
			return  baseUri+"/document/"+p.documentId+"/comments/cursor/"+p.commentPageCursorId;
		}
		else if(p.userId && p.commentPageCursorId){
			return  baseUri+"/user/"+p.userId+"/comments/cursor/"+p.commentPageCursorId;
		}
		else if(p.userId && p.userDocumentPageCursorId){
			return  baseUri+"/user/"+p.userId+"/documents/cursor/"+p.userDocumentPageCursorId;
		}
		else if(p.userId && p.collection){
			return  baseUri+"/user/"+p.userId+"/collections";
		}
		else if(p.userId && p.collectionId){
			return  baseUri+"/user/"+p.userId+"/collection/"+p.collectionId;
		}
		else if(p.documentPageCursorId){
			return  baseUri+"/documents/cursor/"+p.documentPageCursorId;
		}		
		else if(p.baseTagListPageId){
			return  baseUri+"/tags/cursor/"+p.baseTagListPageId;
		}
		else if(p.linkPageCursorId){
			return  baseUri+"/links/cursor/"+p.linkPageCursorId;
		}
		else if(p.docsByTagCursorId && p.documentId){
			return  baseUri+"/tag/"+p.docsByTagCursorId+"/documents/cursor/"+p.documentId;
		}
		else if(p.linksByTagCursorId && p.linkId){
			return  baseUri+"/tag/"+p.linksByTagCursorId+"/links/cursor/"+p.linkId;
		}
		else if(p.userId && p.userCommentPageCursorId){
			return  baseUri+"/user/"+p.userId+"/comments/cursor/"+p.userCommentPageCursorId;
		}		
		else if(p.documentId && p.documentCommentPageCursorId){
			return  baseUri+"/document/"+p.documentId+"/comments/cursor/"+p.documentCommentPageCursorId;
		}		
		else if(p.documentId && p.attachmentId){
			return  baseUri+"/document/"+p.documentId+"/attachment/"+p.attachmentId;
		}		
		else if(p.documentId && p.before && p.after){
			return  baseUri+"/document/"+p.documentId+"/time/"+p.after+"--"+p.before;
		}		
		else if(p.documentId && p.lat && p.lon && p.variance){
			return  baseUri+"/document/"+p.documentId+"/location/"+p.lat+","+p.lon+","+p.variance;
		}		
		else if(p.queryId && p.page){
			return  baseUri+"/query/stored/"+p.queryId+"/cursor/"+p.page;
		}
		else if(p.userId && p.inboxMessageId){
			return  baseUri+"/user/"+p.userId+"/inbox/message/"+p.inboxMessageId;
		}
		else if(p.userId && p.outboxMessageId){
			return  baseUri+"/user/"+p.userId+"/outbox/message/"+p.outboxMessageId;
		}	
		else if(p.userId && p.inboxMessageCursorId){
			return  baseUri+"/user/"+p.userId+"/inbox/messages/cursor/"+p.inboxMessageCursorId;
		}
		else if(p.userId && p.outboxMessageCursorId){
			return  baseUri+"/user/"+p.userId+"/outbox/messages/cursor/"+p.outboxMessageCursorId;
		}			
		else if(p.userId && p.inbox && p.since){
			return  baseUri+"/user/"+p.userId+"/inbox/messages/since/"+p.since;
		}
		else if(p.userId && p.outbox && p.since){
			return  baseUri+"/user/"+p.userId+"/outbox/messages/since/"+p.since;
		}
		else if(p.userId && p.inbox){
			return  baseUri+"/user/"+p.userId+"/inbox";
		}
		else if(p.userId && p.outbox){
			return  baseUri+"/user/"+p.userId+"/outbox";
		}
		else if(p.queryId){
			return  baseUri+"/query/stored/"+p.queryId;
		}	
		else if(p.linkId){
			return  baseUri+"/link/"+p.linkId;
		}	
		else if(p.userId){
			return  baseUri+"/user/"+p.userId;
		}
		else if(p.baseTagId){
			return  baseUri+"/tag/"+p.baseTagId;
		}		
		else if(p.documentId){
			return  baseUri+"/document/"+p.documentId;
		}
		else if(p.userListCursorId){
			return  baseUri+"/users/cursor/"+p.userListCursorId;
		}			
		else{
			return baseUri;
		}
	};
	
	return {
		baseUri : function(){
			return baseUri;
		},		
		user : function(id){
			return builder({
				userId: id
			});
		},
		userListPage :  function(id){
			return builder({
				userListCursorId: id
			});
		},
		mediatypes : function(){
			return baseUri+"/service/mediatypes"; 
		},		
		users : function(){
			return baseUri+"/users"; 
		},		
		usersMultiple : function(){
			return baseUri+"/users/multiple"; 
		},		
		links : function(){
			return baseUri+"/links"; 
		},		
		uuid : function(){
			return baseUri+"/service/uuid"; 
		},
		serviceRegistry : function(){
			return baseUri+"/service/registry"; 
		},
		documents : function(){
			return baseUri+"/documents"; 
		},
		links : function(){
			return baseUri+"/links"; 
		},
		basetags : function(){
			return baseUri+"/tags";
		},	
		queryDispatch : function(){
			return baseUri+"/query";
		},
		
		inbox : function(user){
			return builder({
				userId: user,
				inbox: true
			});
		},
	
		outbox : function(user){
			return builder({
				userId: user,
				outbox: true
			});
		},
		
		inboxSince : function(user,since){
			return builder({
				userId: user,
				inbox: true,
				since : since
			});
		},
	
		outboxSince : function(user,since){
			return builder({
				userId: user,
				outbox: true,
				since : since
			});
		},
	
		inboxMessage : function(user,message){
			return builder({
				userId: user,
				inboxMessageId: message,
			});
		},
		outboxMessage : function(user,message){
			return builder({
				userId: user,
				outboxMessageId: message,
			});
		},
	
		inboxMessagePage : function(user,message){
			return builder({
				userId: user,
				inboxMessageCursorId: message,
			});
		},
		outboxMessagePage : function(user,message){
			return builder({
				userId: user,
				outboxMessageCursorId: message,
			});
		},
		
		tag : function(tag){
			return builder({
				tagId: tag
			});
		},

		link : function(link){
			return builder({
				linkId: link
			});
		},

		document : function(document){
			return builder({
				documentId: document
			});
		},

		attachment : function(document,attachment){
			return builder({
				documentId: document,
				attachmentId: attachment
			});
		},

		collection : function(user,collection){
			return builder({
				userId: user,
				collectionId: collection
			});
		},
		
		documentTime : function(doc,after, before){
			return builder({
				documentId: doc,
				after : after,
				before : before
			});
		},
		
		documentLocation : function(doc,lat,lon,variance){
			return builder({
				documentId: doc,
				lat : lat,
				lon : lon,
				variance : variance
			});
		},
		
		userDocumentPage : function(user, cursor){
			return builder({
				userId: user,
				userDocumentPageCursorId: cursor,
			});
		},
		
		documentCommentPage : function(document, cursor){
			return builder({
				documentId: document,
				documentCommentPageCursorId: cursor,
			});
		},
		
		userCommentPage : function(user, cursor){
			return builder({
				userId: user,
				userCommentPageCursorId: cursor,
			});
		},
		
		
		documentListPage : function(cursor){
			return builder({
				documentPageCursorId: cursor,
			});
		},
		
		linkListPage : function(cursor){
			return builder({
				linkPageCursorId: cursor,
			});
		},
		
		baseTagListPage : function(cursor){
			return builder({
				baseTagListPageId: cursor,
			});
		},
		
		collection : function(user, collection){
			return builder({
				userId: user,
				collectionId: collection
			});			
		},
		
		collection : function(user, collection){
			return builder({
				userId: user,
				collectionId: collection
			});			
		},
		
		collectionDocument : function(user, collection, document){
			return builder({
				userId: user,
				collectionId: collection,
				documentId : document
			});	
		},
		
		collectionPageCursor  : function(user, collection, cursor){
			return builder({
				userId: user,
				collectionId: collection,
				cursorId : cursor
			});
		},
		
		documentCommentsPageCursor  : function(document, cursor){
			return builder({
				documentId: document,
				commentPageCursorId: cursor
			});
		},
		
		userCommentsPageCursor  : function(user, cursor){
			return builder({
				userId: user,
				commentPageCursorId: cursor
			});
		},
		
		comment : function(document, comment){
			return builder({
					documentId: document,
					commentId: comment
			});
		},	

		keyvalue : function(document, user, key){
			return builder({
					documentId: document,
					userId: user,
					key : key
			});
		},	

		query : function(query){
			return builder({
				queryId: query
			});			
		},			
		queryPage : function(query, page){
			return builder({
				queryId: query,
				page : page
			});			
		},	
		
		baseTag : function(tag){
			return builder({
				baseTagId : tag
			});			
		},
		
		documentTag : function(document, tag){
			return builder({
				documentId : document,
				tagId : tag
			});			
		},	
		
		linkTag : function(link, tag){
			return builder({
				linkId : link,
				tagId : tag
			});			
		},
		
		docsByTagPage : function(tag, document){
			return builder({
				documentId : document,
				docsByTagCursorId : tag
			});			
		},
		
		linksByTagPage : function(tag, link){
			return builder({
				linkId : link,
				linksByTagCursorId : tag
			});			
		},
	}
};