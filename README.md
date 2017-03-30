# qewd: Quick and Easy Web Developer
 
Rob Tweed <rtweed@mgateway.com>  
24 February 2016, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

Thanks to Ward De Backer for debugging assistance and functionality suggestions

## What is QEWD?

QEWD is a Node.js-based platform for developing and running interactive browser-based applications and Web/REST services.

QEWD makes use of the [ewd-qoper8](https://github.com/robtweed/ewd-qoper8) module to provide an isolated run-time 
environment for each of your message/request handler functions, meaning that your JavaScript handler functions can use synchronous, 
blocking APIs if you wish / prefer.

QEWD includes an embedded persistent JSON database and session store/cache using Global Storage provided by either the Redis, 
GT.M or Cache databases.

Interactive QEWD applications can be developed using any client-side JavaScript framework (eg Angular, React, etc).

A single instance of QEWD can simultaneously support multiple browser-based applications and Web/REST services.

QEWD uses Express to provide its outward-facing HTTP(S) interface, and Socket.io to provide its outward-facing Web-socket interface.


## Installing

       npm install qewd

## Learning / Using QEWD

See the free online [training course](http://ec2.mgateway.com/ewd/ws/training.html)

- Parts 1 to 3 provide background to the core modules and concepts used by QEWD
- Parts 4 onwards focus on QEWD


## License

 Copyright (c) 2016 M/Gateway Developments Ltd,                           
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
