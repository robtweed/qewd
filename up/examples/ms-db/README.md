# QEWD-Up Demonstration of YottaDB behaving as a Persistent JSON Database / Document Database
 
Rob Tweed <rtweed@mgateway.com>  
13 December 2018, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

## Pre-Requisites

This demonstration uses QEWD-Up.  [Click here or more information on QEWD-Up](https://github.com/robtweed/qewd/tree/master/up)

You must have Docker installed on your machine.

You'll need to have a REST Client available.

When you have Docker installed, pull the *rtweed/qewd-server* Container from the Docker Hub:

      sudo docker pull rtweed/qewd-server

Note: if you want to try this Persistent Database example on a Raspberry Pi, use this version of the QEWD Docker Container instead:

      sudo docker pull rtweed/qewd-server-rpi

and change references in the examples below from *rtweed/qewd-server* to *rtweed/qewd-server-rpi*

Make sure you have created a bridged Docker network for exclusive use by your QEWD-Up instances.  To create this:

      sudo docker network create qewd-net

You can confirm that it exists by running:

      sudo docker network ls

*qewd-net* should appear in the list of networks.


## Installing the QEWD-Up Example

Clone the files in this GitHub Directory onto the machine hosting your Docker *qewd-server* Container

An easy way to do this is to use *svn* which you can install using:

      sudo apt-get install subversion

Then type:

      svn export https://github.com/robtweed/qewd/trunk/up/examples/ms-db

This will create a sub-directory named *ms-db* in your current working directory.  It will contain all the source files needed to run the demonstration application.


## Running the QEWD-Up Example

The application runs as 3 MicroServices:

- **orchestrator**: the externally-facing Orchestrator service
- **login_service**: the MicroService that handles user login
- **db_service**: the MicroService that handles access to the YottaDB JSON database

You'll need to start up 3 instances of the *rtweed/qewd-server* Container:

The examples below will assume you installed the example files into *~/qewd-up/ms-db*.  Adjust the commands to match the directory you've used.

### Orchestrator

Run this command:

     sudo docker run -it --name orchestrator --rm --net qewd-net -p 8080:8080 -v ~/qewd-up/ms-db:/opt/qewd/mapped rtweed/qewd-server

You'll see QEWD starting up and you'll see this when it's ready for use:

      ========================================================
      ewd-qoper8 is up and running.  Max worker pool size: 1
      ========================================================
      ========================================================
      QEWD.js is listening on port 8080
      ========================================================

### login_service

Run this command:

      sudo docker run -it --name login_service --rm --net qewd-net -p 8081:8080 -v ~/qewd-up/ms-db:/opt/qewd/mapped -e microservice="login_service" rtweed/qewd-server

**IMPORTANT**: make sure you use the same name for the *--name* and *-e microservice* parameters

You'll see QEWD starting up and you'll see this when it's ready for use:

      ========================================================
      ewd-qoper8 is up and running.  Max worker pool size: 1
      ========================================================
      ========================================================
      QEWD.js is listening on port 8080
      ========================================================


### db_service

Run this command:

      sudo docker run -it --name db_service --rm --net qewd-net -p 8082:8080 -v ~/qewd-up/ms-db:/opt/qewd/mapped -e microservice="db_service" rtweed/qewd-server

**IMPORTANT**: make sure you use the same name for the *--name* and *-e microservice* parameters

You'll see QEWD starting up and you'll see this when it's ready for use:

      ========================================================
      ewd-qoper8 is up and running.  Max worker pool size: 1
      ========================================================
      ========================================================
      QEWD.js is listening on port 8080
      ========================================================


Everything should now be running and ready to try out!


## The Database CRUD Demonstration REST APIs

Essentially the APIs implement a basic YottaDB-based JSON Storage Server, allowing you to save, retrieve, search and delete persistent JSON documents.  The documents can contain any valid JSON - there's no pre-defined schema needed for the documents.

It's an introduction to what's possible with QEWD's persistent JSON storage.

What follows is a summary of the APIs - give them a try using a REST Client

You'll need to point your REST Client requests at the *Orchstrator* MicroService, eg:

      http://192.168.1.84:8080

Adjust the IP address to that of your host server.


### Logging In

First we must use the Login API. The example is hard-coded to expect a username of *rob* and
a password of *secret*.  If you want to amend the login logic, edit the file
*/ms-db/login_service/login/handler.js*.


Using a REST client:

      POST http://192.168.1.84:8080/api/login
      Content-type: application/json

with a body payload containing

        {
          "username": "rob",
          "password": "secret"  
        }

**Note**: Change the IP address to match that of the host machine that is running the Orchestrator Service.

You should see activity in the console logs for both the *Orchestrator* and *login_service* QEWD instances, and back should come a response looking something like this:

      {
          "ok": true,
          "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NDI2Mz……etc”
      }

You're now ready to try the other APIs that are described below, but in order for them to work, you need to include the JWT that was returned to us as the token property in the */api/login* response shown above.  You need to add it as a *Bearer Token* in the HTTP *Authorization* request header for all the other example APIs: *ie* the *Authorization* header value must be the word *Bearer * followed by the JWT value.

For example:


      GET http://192.168.1.84:8080/api/db/myDocs/list
      Content-type: application/json
      Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1NDI2Mz……etc

[Click here for more information on how QEWD uses JWTs to secure MicroService-based APIs](https://github.com/robtweed/qewd/tree/master/up#how-jwts-protect-your-apis).


### Save a JSON document into the database

API:

        POST /api/db/:documentName

        Request body should contain a JSON document

You decide what the Document Name is.  You can have as many separate documents as you like for each of your Document Names.

eg:

        POST /api/db/myDocs

         {
           "this": {
             "is": "cool",
             "works": "great"
           }
         }


If the JSON is valid (eg double quoted names and values (if strings)), your document will be assigned a numeric Id (starting at 1 and incrementing as you add each new document).

Successful response example:


         {
           "ok": true,
           "id": 23
         }


### List the Ids for a given Document Name

This allows you to discover all the Ids for documents you've stored against a particular Document Name

API:

        GET /api/db/:documentName/list

eg:

        GET /api/db/myDocs/list

Returns an array of Id values.

Successful response example:

        [1,2]


### Retrieve a specific JSON document for a specific Document Name

API:

        GET /api/db/:documentName/:id

eg:

        GET /api/db/myDocs/2

        Will retrieve document #2 from the myDocs collection

Successful response example:

        {"this":{"is":"cool","works":"great"}}


### Delete a specific JSON document within a specific Document Name

API:

        DELETE /api/db/:documentName/:id

eg:

        DELETE /api/db/myDocs/2

        Will delete document #2 from the myDocs collection

Successful response example:

        {"ok":true}


### Search within a specific Document Name

When you save a document, index records are automatically created for each leaf-node path.  This API allows you search against these indices.

API:

        GET /api/db/:documentName/search?:path=:value[&:path=value..etc][&showDetail=true]

eg:

        GET /api/db/myDocs/search?this.works=great

        Will return an array of Ids of all documents in the myDocs collection that have a path of *this.works* with a value of *great*

Successful response example:

        ["2"]

If you add *showDetail=true* to the QueryString, it will retrieve the matching document contents too, eg:

        GET /api/db/myDocs/search?this.works=great&showDetail=true

Response:

        {"2":{"this":{"is":"cool","works":"great"}}}

You can specify as many path/value combinations as you like, eg

        GET /api/db/myDocs/search?this.works=great&this.is=cool&showDetail=true

        Response: {"2":{"this":{"is":"cool","works":"great"}}}

but:

        GET /api/db/myDocs/search?this.works=great&this.is=bad&showDetail=true

        Response: {}   // no matches


## Hacking the Demonstration Code

If you want to understand how the APIs work and perhaps have a go at modifying them, look in the */ms-db/db_service* directory where you'll find the handlers 
for the supported APIs.  All the examples use a persistent Document named *Documents*.

For more information on QEWD's JavaScript/JSON abstraction of Global Storage, go to the
[QEWD.js Training Resources](http://docs.qewdjs.com/qewd_training.html) page and study Parts 17 - 27

## Inspecting the YottaDB Database

If you're interested in confirming that your persistent Documents are being created and/or seeing what the JSON storage looks like in YottaDB's native Global Storage, you can do a couple of things.

### Use the *qewd-monitor* Application

The *qewd-monitor* browser-based application provides a way of monitoring the health and activity of QEWD systems.  Each of your MicroServices have it available.  One of the things you can do from the *qewd-monitor* application is to inspect your Persistent Documents.

So, start the *qewd-monitor* application on the *db_service* MicroService by entering this URL in a browser:

      http://192.168.1.84:8082/qewd-monitor

Change the IP address to match that of your host machine, but make sure you use port 8082 which is the port on which the *db_service* MicroService is listening.

You'll need to enter the QEWD management password which has been set by default as:

      keepThisSecret!

The Overview panel will appear, showing configuration information and the activity in the QEWD Master and Worker processes.

Click the *Document Store* tab in the top banner and you should see two Persistent JSON Documents named *Documents* and *DocumentsIndex*.  Click on them to drill down into their structure.

### Using the YottaDB Interactive Shell

If you want to see the actual physical Globals used to store your JSON documents, you can do so by first shelling into the *db_service* MicroService Container:

      sudo docker exec -it db bash


You'll see the Container's command line prompt, eg:

      root@5f770ffdf9ac:/opt/qewd#

Now enter the YottaDB shell:

      ./ydb

and you should see the prompt:

      YDB>

Now you can examine the Globals using, for example:


      zwr ^Documents

and

      zwr ^DocumentsIndex

To exit the YottaDB shell, type:

      h

and you'll return to the Container's prompt.

To exit from the Container, just type:

      exit


## Stopping the MicroServices

Just type CRTL & C in the terminal session where each MicroService is running.  Once each stops, you can exit
the Container by typing

      exit


## YottaDB Database Persistence

Note that when you stop the *db_service* Container, you'll lose any Documents that you created using the APIs.

This is because, when we started up the *rtweed/qewd-server* Container, we didn't map the YottaDB database files to the host on which your Containers run.

To persist your *db_service* data, you can make use of the pre-created, initialised 
[YottaDB Gbldir files](https://github.com/robtweed/yotta-gbldir-files).  Do this as follows:

First, create a directory on your host machine for these files, eg:

      ~/ms-db/yottadb

and clone the files into it:

      cd ~/ms-db/yottadb
      svn export https://github.com/robtweed/yotta-gbldir-files/trunk --depth files db_service


**Note**: if you're running this example on a Raspberry Pi, you need the correct versions of the files for the Raspberry Pi.  Change the commands above to:

      cd ~/ms-db/yottadb
      svn export https://github.com/robtweed/yotta-gbldir-files/trunk/rpi/r1.22 db_service


You should now see the three files that will be used by YottaDB for persistent data storage in the *~/ms-db/yottadb/db_service* directory.

It's a good idea to ensure their permissions allow read/write access:

      cd db_service
      sudo chmod 666 *

Now start the *db_service* MicroService Container like this:

      sudo docker run -it --name db_service --rm --net qewd-net -p 8082:8080 -v ~/qewd-up/ms-db:/opt/qewd/mapped -v ~/qewd-up/ms-db/yottadb/db_service:/root/.yottadb/r1.22_x86_64/g -e microservice="db_service" rtweed/qewd-server

*ie* add this to the *docker run* command: **-v ~/qewd-up/ms-db/yottadb/db_service:/root/.yottadb/r1.22_x86_64/g**

This makes YottaDB within the Container use the external files on the host for its storage.

Now, even if you stop and restart the *db_service* MicroService, any persistent JSON documents that you created using the APIs will continue to exist.


## License

 Copyright (c) 2018-19 M/Gateway Developments Ltd,                           
 Redhill, Surrey UK.                                                      
 All rights reserved.                                                     
                                                                           
  http://www.mgateway.com                                                  
  Email: rtweed@mgateway.com                                               
                                                                           
                                                                           
  Licensed under the Apache License, Version 2.0 (the "License");          
  you may not use this file except in compliance with the License.         
  You may obtain a copy of the License at                                  
                                                                           
      http://www.apache.org/licenses/LICENSE-2.0                           
                                                                           
  Unless required by applicable law or agreed to in writing, software      
  distributed under the License is distributed on an "AS IS" BASIS,        
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
  See the License for the specific language governing permissions and      
   limitations under the License.      
