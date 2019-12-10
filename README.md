# qewd: Quick and Easy Web Developer
 
Rob Tweed <rtweed@mgateway.com>  
24 February 2016, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

Thanks to Ward De Backer for debugging assistance and functionality suggestions

## What is QEWD?

In summary: [QEWD](http://qewdjs.com) is a Node.js-based platform for developing and running both interactive WebSocket-based applications and REST APIs.  QEWD can run as either a monolithic back-end or as a set of MicroServices.

QEWD uses a [unique architecture](https://medium.com/the-node-js-collection/having-your-node-js-cake-and-eating-it-too-799e90d40186)
 that prevents CPU-intensive or long-running APIs bringing a Node.js system to its knees, 
and includes [QEWD-JSdb](https://github.com/robtweed/qewd-jsdb), a powerful high-performance, 
tightly-integrated multi-model database which, uniquely, presents your data as persistent JavaScript Objects.


## Try it out

The quickest way to try out QEWD is using the pre-built Docker version.

    docker pull rtweed/qewd-server

There's also a Raspberry Pi version

    docker pull rtweed/qewd-server-rpi

Create three files within a folder of your choice (eg *~/myQEWDApp*), using the sub-folder structure shown below:

        ~/myQEWDApp
            |
            |_ configuration
            |            |
            |            |_ config.json
            |            |
            |            |_ routes.json
            |
            |_ apis
            |    |
            |    |_ helloworld
            |            |
            |            |_ index.js


### *config.json*

      {
        "qewd_up": true
      }


### *routes.json*

      [
        {
          "uri": "/api/helloworld",
          "method": "GET",
          "handler": "helloworld"
        }
      ]


### *index.js*

      module.exports = function(args, finished) {
        finished({
          hello: 'world'
        });
      };


Fire up the QEWD Docker instance:

    docker run -it --name qewdup --rm -p 3000:8080 -v ~/myQEWDApp:/opt/qewd/mapped rtweed/qewd-server

or on a Raspberry Pi:

    docker run -it --name qewdup --rm -p 3000:8080 -v ~/myQEWDApp:/opt/qewd/mapped rtweed/qewd-server-rpi


Try out your REST API:

    http://{{host-ip-address}}:3000/api/helloworld

*eg*:

    http://192.168.1.100:3000/api/helloworld


## Further Reading

[Baseline QEWD Environment](https://github.com/robtweed/qewd-baseline), with Tutorials on devloping 
[REST APIs](https://github.com/robtweed/qewd-baseline/blob/master/REST.md) and 
[Interactive WebSocket-based Applications](https://github.com/robtweed/qewd-baseline/blob/master/INTERACTIVE.md).

[Getting Started with QEWD using QEWD-Up](https://github.com/robtweed/qewd/tree/master/up)

[Information on QEWD-JSdb](https://github.com/robtweed/qewd-jsdb), 
the multi-model database that is integrated with QEWD. This is a unique,
ground-breaking database abstraction which provides you with on-disk, persistent JavaScript Objects
with which you directly interact via JavaScript.



## License

 Copyright (c) 2016-19 M/Gateway Developments Ltd,                           
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
