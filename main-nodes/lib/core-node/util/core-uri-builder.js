module.exports = function(baseUri){
	
	var builder = function(p){
		if(p.documentId && p.commentId){
			return  baseUri+"/document/"+p.documentId+"/comment/"+p.commentId;
		}		
		else if(p.queryId && p.page){
			return  baseUri+"/query/stored/"+p.queryId+"/cursor/"+p.page;
		}
		else if(p.queryId){
			return  baseUri+"/query/stored/"+p.queryId;
		}	
		else if(p.userId){
			return  baseUri+"/user/"+p.userId;
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
		users : function(){
			return baseUri+"/users"; 
		},		
		usersMultiple : function(){
			return baseUri+"/users/multiple"; 
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
	
		tag : function(tag){
			return builder({
				tagId: tag
			});
		},
		comment : function(document, comment){
			return builder({
					documentId: document,
					commentId: comment
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
	}
};