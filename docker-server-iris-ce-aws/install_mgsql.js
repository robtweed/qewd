var jsdb = require('./jsdb_shell');
var result = jsdb.db.dbx.classmethod('%SYSTEM.OBJ', 'Load', '/ISC/qewd-install/m/mgsql_iris.xml', 'ck-d');
if (result.toString() === '1') {
  console.log('mgsql routines installed');
}
else {
  console.log('There was a problem installing the mgsql routines');
}

result = jsdb.db.dbx.classmethod('%SYSTEM.OBJ', 'Load', '/ISC/qewd-install/node_modules/qewd-mg-dbx/ci/qewdInterface.xml', 'ck-d');
if (result.toString() === '1') {
  console.log('qewd-jsdb qewdInterface routine installed');
}
else {
  console.log('There was a problem installing the qewdInterface routine');
}

jsdb.close();
