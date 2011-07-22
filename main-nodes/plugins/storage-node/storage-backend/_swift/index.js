var url = require('url');
var util = require('util');
var http = require('http');
var events = require("events");
var fs = require("fs");
var path = require('path');

require.paths.unshift(path.join(__dirname, 'lib'));

var Pool = require('pool').Pool;

/**
 * A backend storage implementation using OpenStack Object Storage (Swift).
 * 
 * 
 * Developed and tested using Swift v1.1.0.
 * 
 * @author Benjamin Erb
 */
exports.Plugin = {

	version : "0.1.0",

	author : "Benjamin Erb",

	name : "OpenStack Object Storage (Swift) Backend",

	id : "storage-node-swift-backend",

	init : function(options) {
		
		var that = this;
		this.error = null;
		
		var authUri = url.parse(options.swift.authUri || "http://127.0.0.1:11000/v1.0");
		var httpClient = http.createClient(authUri.port, authUri.hostname);
		
		var headers = {
				"X-Storage-User" : options.swift.account+":"+options.swift.user,
				"X-Storage-Pass" : options.swift.password,
				"Host" : authUri.host
		};
		
		var request = httpClient.request("GET",authUri.pathname+(authUri.search||"")+(authUri.hash||""), headers);
		
		request.once('response', function(response){
			if(response.statusCode === 204 && response.headers && response.headers['x-storage-url'] && response.headers['x-auth-token']){
				
				//TODO: remove
				var tmp = response.headers['x-storage-url'];
				tmp = tmp.replace("127.0.0.1","192.168.2.147");
				var storageUri = url.parse(tmp);
				
				var authToken = response.headers['x-auth-token'];
				//TODO: test request
				var httpClient = http.createClient(storageUri.port, storageUri.hostname);
				var checkHeaders = {
						"X-Auth-Token" : authToken,
						"Host" : storageUri.host
				};
				console.dir(checkHeaders);

				var p = path.join(storageUri.pathname,"bla");
				console.log(p+"\t"+authToken);
				var checkRequest = httpClient.request("PUT",p, checkHeaders);
				checkRequest.once('response', function(checkResponse){
					console.log(checkResponse.statusCode);
					console.dir(checkResponse.headers);
				});
				checkRequest.end();
				
				
				//TODO: create container if neccessary
				console.dir(response.headers);
			}
			else{
				that.error = "Invalid Credentials";
				console.log("oops");
				console.dir(response.headers);
			}
			console.log(response.statusCode);
		});
		
		request.end();
		return;
		
		
		
		this.rootDir = options.rootDir || 'data/';
		this.pool = new Pool(options.couchdb.host || "127.0.0.1",options.couchdb.port || 5984, {
			poolsize : options.poolsize || 16
		});
		this.db = options.couchdb.database || "document_files";
	},

	get : function(documentId, attachmentId, extension, etag, isHeadRequest) {

		var emitter = new events.EventEmitter();
		var that = this;

		process.nextTick(function() {

			var p = path.join("/", that.db, documentId, attachmentId + "." + extension);

			var headers = {};

			if (etag) {
				headers['If-None-Match'] = etag;
			}

			var method = (isHeadRequest ? "HEAD" : "GET");

			that.pool.dispatchRequest(method, p, headers, function(request) {
				request.end();

				request.once('response', function(response) {
					
					if(response.statusCode === 404){
						emitter.emit("error",{'reason':"not found"});
					}
					else if(response.statusCode === 200 || response.statusCode === 304){
						var metaData = {
								'Etag' : response.headers['etag'],
								'Content-Length' : response.headers['content-length'],
								'Content-Type' : response.headers['content-type']
							};

							emitter.emit("metadata", metaData, ((etag && response.headers['etag'] && etag === response.headers['etag']) ? 304 : 200));
							if(!isHeadRequest && response.statusCode !== 304){
								emitter.emit("data", response);
							}
					}
					else{
						emitter.emit("error");
					}
				});
			});
		});
		return emitter;
	},

	put : function(documentId, attachmentId, extension, mimeType, size, readableStream) {
		var emitter = new events.EventEmitter();
		var that = this;
		
		readableStream.pause();
		
		process.nextTick(function() {
			
			var p = path.join("/", that.db, documentId);

			that.pool.dispatchRequest("GET", p, {}, function(request) {
				request.end();
				request.once('response', function(response) {
					if(response.statusCode === 404){
						emitter.emit("error",{'reason':"not found"});
					}
					else if(response.statusCode === 200){
						
						response.setEncoding('utf8');
						
						var buffer = [];
						
						response.on('data', function (chunk) {
							buffer.push(chunk);
				        });
						response.on('end', function () {
							var doc;
							try {
								doc = JSON.parse(buffer.join(''));
							}
							catch (e) {
								emitter.emit("error",{'reason':e.toString()});
							}
							if(doc){
								var rev = doc._rev;
								if(doc._attachments[attachmentId+"."+extension]){
									emitter.emit("error",{'reason':"conflict"});
								}
								else{
									//attachment does not exist, but document is there => commit upload 
									var target = path.join("/", that.db, documentId, attachmentId+"."+extension);
									target += '?rev='+rev;
									
									var headers = {
											"Content-Length" : size,
											"Content-Type" : mimeType
									};
									that.pool.dispatchRequest("PUT", target, headers, function(uploadRequest) {
										readableStream.on("data", function(chunk) {
											if(uploadRequest.write(chunk) === false){
												readableStream.pause();	
											}
										});

										uploadRequest.on("drain", function() {
											readableStream.resume();
										});

										readableStream.on("end", function() {
											uploadRequest.removeAllListeners("drain");
											uploadRequest.once("drain", function() {
												uploadRequest.end();
											});
										});

										readableStream.resume();
										
										uploadRequest.once('response',function(uploadResponse){
											if(uploadResponse.statusCode === 201){
												emitter.emit("success");
											}
											else if(uploadResponse.statusCode === 409){
												emitter.emit("error");
												//TODO: retry with new rev
											}
											else{
												emitter.emit("error");
											}
										});
									});
								}
							}
				        });
					}
					else{
						emitter.emit("error");
					}
				});
			});
		});
		
		return emitter;
	}
};