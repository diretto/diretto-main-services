/**
 * A helper object that generates resource URIs using the v2 URI templates.
 * 
 * @author Benjamin Erb
 * 
 */
module.exports = function(baseUri){
	
	var builder = function(p){
		
		if(p.documentId && p.commentId){
			return  baseUri+"/document/"+p.documentId+"/comment/"+p.commentId;
		}		
		else{
			return baseUri;
		}
	};
	
	return {
		baseUri : function(){
			return baseUri;
		},		
		
		documentDetailsFeed :  function(id){
			return baseUri+"/feed/document/"+id; 
		},
		
		attachmentsFeed : function(){
			return baseUri+"/feed/attachments"; 
		},
		
		attachmentsFeedPage : function(id){
			return baseUri+"/feed/attachments/cursor/"+id; 
		},
		
		commentsFeed : function(){
			return baseUri+"/feed/comments"; 
		},
		
		commentsFeedPage : function(id){
			return baseUri+"/feed/comments/cursor"+id; 
		},
		
		documentsFeed : function(){
			return baseUri+"/feed/documents"; 
		},
		
		documentsFeedPage : function(id){
			return baseUri+"/feed/documents/cursor/"+id; 
		},
		
		mediaFeed : function(type){
			return baseUri+"/feed/media/"+type; 
		},

		mediaFeedPage : function(type, cursor){
			return baseUri+"/feed/media/"+type+"/cursor/"+cursor; 
		},
		
		geoBboxFeed : function(){
			return baseUri+"/feed/geo/area"; 
		},
		
		geoDocumentsFeed : function(){
			return baseUri+"/feed/geo/documents"; 
		},
		
		geoDocumentPositionsFeed : function(id){
			return baseUri+"/feed/geo/document/"+id+"/positions"; 
		},
		
	}
};