# diretto Main Services

A node.js-based implementation of the following diretto platform services: 

 - Core API
 - Storage API
 - Feed API

## Installation Guide

The setup of the main services implementation requires: 

 - latest node.js 0.4.x
 - no NPM (self-contained dependencies)
 - CouchDB with CouchDB-Lucene extension

First, the CouchApps inside main-couchapp/ must be deployed to your CouchDB server that will power your instance. 
There is a helper script to deploy all three CouchApps together. The default database name is  `diretto_main`.

Next, go to the main-nodes/conf/ directory and change the settings according to your deployment parameters. 

Then, the services can be started. Note that the Core API service must be started as last service, as it is checking
other services to run for adding them into its registry. 

## License (not valid for `diretto-main-nodes/main-nodes/vendor/`)

	Copyright (c) 2011 Benjamin Erb, Tobias Schlecht

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
	OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

