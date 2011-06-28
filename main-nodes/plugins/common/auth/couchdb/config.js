exports.config = {
		couchdb : {
//			host : "api.diretto.org",
			host : "localhost",
			port : 5984,
			database : "users",
			poolsize : 4
		},
		cache : {
			size : 1000,
			lease : 120000
		}
};