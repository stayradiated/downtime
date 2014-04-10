var request = require('request');
var fs = require('fs');

var filename = __dirname + '/db.txt';
var lastStatus = '';

var saveResult = function (result) {
  if (result === lastStatus) return;

  var data = Date.now() + ' ' + result + '\n';
  console.log(data);

  lastStatus = result;

  fs.appendFile(filename, data, function (err) {
    if (err) throw err;
  });
};

var options = {
  url: 'http://192.168.1.1/connect.html',
  headers: {
    Authorization: 'Basic YWRtaW46YWRtaW4='
  }
};

var regex = /var pppstatus='(.+)';/;

var fetchStatus = function () {
  request.get(options, function (err, res, body) {
    var status;
    if (err) status = 'Off';
    else status = body.match(regex)[1];
    saveResult(status);
  });
};

(function loop () {
  fetchStatus();
  setTimeout(loop, 1000 * 10);
}());
