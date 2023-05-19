/*

 ----------------------------------------------------------------------------
 | QEWD-Up Demonstration of Document Database Functionality                 |
 |                                                                          |
 | Copyright (c) 2023 MGateway Ltd,                                         |
 | Banstead, Surrey UK.                                                     |
 | All rights reserved.                                                     |
 |                                                                          |
 | https://www.mgateway.com                                                 |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  13 December 2018

*/


var db_search = require('./search');

module.exports = function(args, finished) {
  var showDetail = false;
  if (args.req.query && args.req.query.showDetail && args.req.query.showDetail === 'true') {
    showDetail = true;
    delete args.req.query.showDetail;
  }
  finished(db_search.call(this, 'Documents', args.documentName, args.req.query, showDetail));
};