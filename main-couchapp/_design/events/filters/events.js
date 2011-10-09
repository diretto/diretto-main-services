function(doc, req){
	if(doc.type && doc.type === 'event'){
		return true;	
	}
	else{
		return false;
	}
}