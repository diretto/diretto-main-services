var url = require('url');
var util = require('util');
var http = require('http');
var events = require("events");
var fs = require("fs");
var path = require('path');

require.paths.unshift(path.join(__dirname, 'lib'));

var Pool = require('pool').Pool;

/**
 * A backend storage implementation using CouchDB.
 * 
 * @author Benjamin Erb
 */
exports.Plugin = {

	version : "0.1.0",

	author : "Benjamin Erb",

	name : "CouchDB Storage Backend",

	id : "storage-node-couchdb-backend",

	init : function(options) {
		console.log("Initializing " + this.name);
		this.pool = new Pool(options.couchdb.host || "127.0.0.1", options.couchdb.port || 5984, {
			poolsize : options.poolsize || 16
		});
		this.db = options.couchdb.database || "document_files";

		// Check if database exists and create if not
		var that = this;
		this.pool.dispatchRequest("HEAD", path.join("/", this.db), {}, function(request) {
			request.once('response', function(response) {
				if (response.statusCode === 404) {
					that.pool.dispatchRequest("PUT", path.join("/", that.db), {}, function(createRequest) {
						createRequest.end();
					});
				}
			});
			request.end();
		});
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
				request.once('response', function(response) {

					if (response.statusCode === 404) {
						emitter.emit("error", {
							'reason' : "not found"
						});
					}
					else if (response.statusCode === 200 || response.statusCode === 304) {
						var metaData = {
							'Etag' : response.headers['etag'],
							'Content-Length' : response.headers['content-length'],
							'Content-Type' : response.headers['content-type']
						};

						emitter.emit("metadata", metaData, ((etag && response.headers['etag'] && etag === response.headers['etag']) ? 304 : 200));
						if (!isHeadRequest && response.statusCode !== 304) {
							emitter.emit("data", response);
						}
					}
					else {
						emitter.emit("error");
					}
				});
				request.end();
			});
		});
		return emitter;
	},

	put : function(documentId, attachmentId, extension, mimeType, size, readableStream) {
		var emitter = new events.EventEmitter();
		var that = this;

		readableStream.pause();

		process.nextTick(function() {

			that.prepareUpload(emitter, path.join("/", that.db, documentId), function(err, doc) {
				if (!err) {

					var rev = doc._rev;
					if (doc._attachments && doc._attachments[attachmentId + "." + extension]) {
						emitter.emit("error", {
							'reason' : "conflict"
						});
					}
					else {
						// attachment does not exist, but document is there
						// => commit upload
						var target = path.join("/", that.db, documentId, attachmentId + "." + extension);
						target += '?rev=' + rev;

						var headers = {
							"Content-Length" : size,
							"Content-Type" : mimeType
						};

						that.pool.dispatchRequest("PUT", target, headers, function(uploadRequest) {
							readableStream.on("data", function(chunk) {
								if (uploadRequest.write(chunk) === false) {
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

							uploadRequest.once('response', function(uploadResponse) {
								if (uploadResponse.statusCode === 201) {
									emitter.emit("success");
								}
								else if (uploadResponse.statusCode === 409) {
									emitter.emit("error");
									// TODO: catch and retry with newer
									// revision
								}
								else {
									emitter.emit("error");
								}
							});
						});
					}
				}
			});
		});
		return emitter;
	},

	prepareUpload : function(emitter, docpath, callback) {
		var that = this;
		that.pool.dispatchRequest("GET", docpath, {}, function(request) {
			request.end();
			request.once('response', function(response) {
				if (response.statusCode === 404) {
					that.pool.dispatchRequest("PUT", docpath, {'Content-Type':"application/json"}, function(putRequest) {
						putRequest.write('{}');
						putRequest.end();
						putRequest.once('response',function(putResponse){
							if (putResponse.statusCode === 201 || putResponse.statusCode === 409){
								that.prepareUpload(emitter, docpath, callback);
							}
							else{
								emitter.emit("error", {
									'reason' : "internal error"
								});
							}
						});
					});
				}
				else if (response.statusCode === 200) {

					response.setEncoding('utf8');

					var buffer = [];

					response.on('data', function(chunk) {
						buffer.push(chunk);
					});
					response.on('end', function() {
						var doc;
						try {
							doc = JSON.parse(buffer.join(''));
							callback(null, doc);
						}
						catch (e) {
							emitter.emit("error", {
								'reason' : e.toString()
							});
						}
					});
				}
				else {
					emitter.emit("error");
				}
			});
		});
	}
};