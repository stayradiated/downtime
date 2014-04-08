var request = require('request');

var db = [];

var saveResult = function (result) {
  db.push([Date.now(), result]);
  console.log(db);
};

var fetchStatus = function () {
  request.get('http://192.168.1.1/connect.html', function () {
  });
};

(function loop () {
  fetchStatus();
  setTimeout(loop, 1000);
}());
