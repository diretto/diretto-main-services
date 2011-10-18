# CouchApp for CouchDB-based persistence layer of diretto main API services

The application is divided into three independent CouchApps, which should be deployed to the same database: 

 - docs => main CouchApp
 - users => user management
 - events => internal event message sourcing

