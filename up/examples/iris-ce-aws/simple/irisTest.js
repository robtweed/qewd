/*

 ----------------------------------------------------------------------------
 | ewd-document-store: Persistent JavaScript Objects and Document Database  |
 |                      using Global Storage                                |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
 | Reigate, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
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

  7 September 2017

*/

'use strict';

// Standalone example demonstrating use of ewd-document-store with Cache database
// You may need to run this as sudo because of permissions

var DocumentStore = require('ewd-document-store');
var Iris = require('iris').IRIS;
var db = new Iris();

var ok = db.open({
  path: '/usr/irissys/mgr',
  username: '_SYSTEM',
  password: 'secret123',
  namespace: 'USER'
});

console.log('ok: ' + JSON.stringify(ok));
console.log('version: ' + db.version());

var documentStore = new DocumentStore(db);
var rob = new documentStore.DocumentNode('rob');

var temp = new documentStore.DocumentNode('temp', [1]);
console.log('exists: ' + temp.exists);
console.log('hasValue: ' + temp.hasValue);
console.log('hasChildren: ' + temp.hasChildren);
console.log('value: ' + temp.value);

console.log(JSON.stringify(temp.getDocument(), null, 2));

documentStore.on('afterSet', function (node) {
  console.log('afterSet: ' + JSON.stringify(node));
});

rob.$('x').value = 'hello';
rob.$('y').value = 'world';
rob.$('a').increment();

var z = {
  a: 'this is a',
  b: 'this is b',
  Barton: 'J',
  Briggs: 'A',
  Davies: 'D',
  Davis: 'T',
  Douglas: 'N',
  c: ['a', 's', 'd'],
  d: {
    a: 'a',
    b: 'b'
  }
};

rob.$('z').setDocument(z);

console.log(JSON.stringify(rob.getDocument(), null, 2));

console.log('forEachChild through rob document:');
rob.forEachChild(function (nodeName) {
  console.log(nodeName);
});

console.log('forEachChild through rob document, stopping early:');
rob.forEachChild(function (nodeName) {
  console.log(nodeName);
  if (nodeName === 'x') {
    return true;
  }
});

console.log('forEachChild through rob document, in reverse:');
rob.forEachChild({
  direction: 'reverse'
}, function (nodeName) {
  console.log(nodeName);
});

console.log('forPrefix through rob global starting x:');
rob.forEachChild({
  prefix: 'x'
}, function (subscript) {
  console.log(subscript);
});

console.log('forEachLeafNode through rob global:');
rob.forEachLeafNode(function (value) {
  console.log(value);
});

console.log('Number of children: ' + rob.countChildren());

var robx = rob.$('x', true);
console.log('robx: ' + robx.value);
console.log(JSON.stringify(rob, null, 2));
console.log('===============');
console.log(JSON.stringify(robx, null, 2));

var roby = rob.$x.$('y');
console.log('parent: ' + roby.parent.value);

var first = rob.firstChild;
console.log('first: ' + first.name);
console.log('next = ' + first.nextSibling.name);

var last = rob.lastChild;
console.log('last: ' + last.name);
console.log('previous = ' + last.previousSibling.name);

var z = rob.$z;
console.log('Names from Br to Da');
z.forEachChild({
  range: {
    from: 'Br',
    to: 'Da'
  }
}, function (lastName, node) {
  console.log('LastName: ' + lastName + '; firstName: ' + node.value);
});
console.log('------------');
console.log('Names from Br to Db');
z.forEachChild({
  range: {
    from: 'Br',
    to: 'Db'
  }
}, function (lastName, node) {
  console.log('LastName: ' + lastName + '; firstName: ' + node.value);
});
console.log('------------');
console.log('Names from Briggs to Davis');
z.forEachChild({
  range: {
    from: 'Briggs',
    to: 'Davis'
  }
}, function (lastName, node) {
  console.log('LastName: ' + lastName + '; firstName: ' + node.value);
});
console.log('------------');
console.log('Names from B to D');
z.forEachChild({
  range: {
    from: 'B',
    to: 'D'
  }
}, function (lastName, node) {
  console.log('LastName: ' + lastName + '; firstName: ' + node.value);
});
console.log('------------');
console.log('Names from B');
z.forEachChild({
  range: {
    from: 'B'
  }
}, function (lastName, node) {
  //jshint unused:false
  console.log('LastName: ' + lastName);
});
console.log('------------');
console.log('Names from D');
z.forEachChild({
  range: {
    from: 'D'
  }
}, function (lastName, node) {
  //jshint unused:false
  console.log('LastName: ' + lastName);
});
console.log('------------');
console.log('Names to D');
z.forEachChild({
  range: {
    to: 'D'
  }
}, function (lastName, node) {
  //jshint unused:false
  console.log('LastName: ' + lastName);
});
console.log('------------');

console.log('temp before: ' + temp.value);
temp.value = 1234;
console.log('temp after: ' + temp.value);

temp.delete();
console.log('temp after delete: ' + temp.value);

var list = documentStore.list();
console.log(JSON.stringify(list));

db.close();
