# QEWD-Up Demonstration of Cach&#233; behaving as a Persistent JSON Database / Document Database
 
Rob Tweed <rtweed@mgateway.com>  
13 December 2018, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

## Pre-Requisites

This demonstration uses QEWD-Up.  [Click here or more information on QEWD-Up](https://github.com/robtweed/qewd/tree/master/up)

You must have Docker installed on your machine.

You'll need to have a REST Client available.

When you have Docker installed, pull the *rtweed/qewd-server-cache* Container from the Docker Hub:

      sudo docker pull rtweed/qewd-server-cache

This Container includes a pre-installed Single User Evaluation copy of Cach&#233; and is therefore a couple of Gb in size.
Don't be surprised, therefore, if it takes some time to download to your host machine.


## Installing the QEWD-Up Example

Clone the files in this GitHub Directory onto the machine hosting your Docker *qewd-server-cache* Container

An easy way to do this is to use *svn* which you can install using:

      sudo apt-get install subversion

Then type:

      svn export https://github.com/robtweed/qewd/trunk/up/examples/cache/ms-db

This will create a sub-directory named *ms-db* in your current working directory.  It will contain all the source files
needed to run the demonstration application.


## Adjust the QEWD-Up Configuration

You'll need to edit the *host* IP addresses in the */ms-db/configuration/config.json* file to match that of your host server.

The file currently contains these lines:

      "name": "login_service",
      "host": "http://192.168.1.84",


      "name": "db_service",
      "host": "http://192.168.1.84",

These IP addresses are used by the *Orchestrator* MicroService Container to communicate with the *login_service* and *db_service*
MicroService Containers (see next section).


## Running the QEWD-Up Example

The application runs as 3 MicroServices:

- **orchestrator**: the externally-facing Orchestrator service
- **login_service**: the MicroService that handles user login
- **db_service**: the MicroService that handles access to the Cach&#233; JSON database

You'll need to start up 3 instances of the *rtweed/qewd-server-cache* Container:

The examples below will assume you installed the example files into *~/qewd-up/ms-db*.  Adjust the commands to match the
directory you've used.

### Orchestrator

Run this command:

     sudo docker run -it --name orchestrator --rm -p 8080:8080 -v ~/qewd-up/ms-db:/opt/qewd/mapped rtweed/qewd-server-cache

When this starts, you'll see a prompt similar to this:

      root@5f770ffdf9ac:/opt/qewd#

Now start up Cach&#233; and QEWD:

      . startup.sh

This takes a while to start Cach&#233; so be patient.  Eventually you'll see QEWD starting up and you'll see this:

      ========================================================
      ewd-qoper8 is up and running.  Max worker pool size: 1
      ========================================================
      ========================================================
      QEWD.js is listening on port 8080
      ========================================================

### login_service

Run this command:

      sudo docker run -it --name login --rm -p 8081:8080 -v ~/qewd-up/ms-db:/opt/qewd/mapped -e microservice="login_service" rtweed/qewd-server-cache

When this starts, you'll see a prompt similar to this:

      root@5f770ffdf9ac:/opt/qewd#

Now start up Cach&#233; and QEWD:

      . startup.sh

This takes a while to start Cach&#233; so be patient.  Eventually you'll see QEWD starting up and you'll see this:

      ========================================================
      ewd-qoper8 is up and running.  Max worker pool size: 1
      ========================================================
      ========================================================
      QEWD.js is listening on port 8080
      ========================================================


### db_service

Run this command:

      sudo docker run -it --name db --rm -p 8082:8080 -v ~/qewd-up/ms-db:/opt/qewd/mapped -e microservice="db_service" rtweed/qewd-server-cache

When this starts, you'll see a prompt similar to this:

      root@5f770ffdf9ac:/opt/qewd#

Now start up Cach&#233; and QEWD:

      . startup.sh

This takes a while to start Cach&#233; so be patient.  Eventually you'll see QEWD starting up and you'll see this:

      ========================================================
      ewd-qoper8 is up and running.  Max worker pool size: 1
      ========================================================
      ========================================================
      QEWD.js is listening on port 8080
      ========================================================


Everything should now be running and ready to try out!


## The Database CRUD Demonstration REST APIs

Essentially the APIs implement a basic Cach&#233;-based JSON Storage Server, allowing you to save, retrieve, search and delete persistent JSON documents.  The documents can contain any valid JSON - there's no pre-defined schema needed for the documents.

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


      GET http://192.168.1.100:8080/api/db/myDocs/list
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


### Seaerch within a specific Document Name

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
for the supported APIs.  All the examples use a persistent Document (*aka* Global) named *Documents*.

For more information on QEWD's JavaScript/JSON abstraction of Global Storage, go to the
[QEWD.js Training Resources](http://docs.qewdjs.com/qewd_training.html) page and study Parts 17 - 27


## Stopping the MicroServices

Just type CRTL & C in the terminal session where each MicroService is running.  Once each stops, you can exit
the Container by typing

      exit

## Cach&#233; Database Persistence and Limitations of the QEWD Container

Note that when you stop the *db_service* Container, you'll lose any Documents that you created using the APIs.

This is because the *rtweed/qewd-server-cache* Container does not map Cach&#233; namespace volumes to the host on which your Containers run.

The *rtweed/qewd-server-cache* Container is deliberately limited in its capabilities and is only provided for the
purposes of this demonstration, allowing Cach&#233; developers to quickly and easily explore and understand the
capabilities of QEWD.js.  

Having hopefully raised your interest in what QEWD.js is capable of and how it can be used with Cach&#233;, you'll probably want something suitable for a more serious and/or production environment.  You'll
need to create a fully-fledged Cach&#233; (or IRIS) Container that allows for database persistence.  Feel free to use
my [Dockerfile](https://github.com/robtweed/qewd/tree/master/docker-server-cache) as a guide to what you need to do in order to integrate QEWD with Cach&#233;.



## License

 Copyright (c) 2018 M/Gateway Developments Ltd,                           
 Reigate, Surrey UK.                                                      
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
