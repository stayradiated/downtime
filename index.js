var request = require('request');
var fs = require('fs');

var filename = __dirname + '/db.txt';
var lastStatus = '';

var saveResult = function (result) {
  if (result === lastStatus) return;

  var data = (new Date()).toString() + ',' + result + '\n';
  console.log(data);

  lastStatus = result;

  fs.appendFile(filename, data, function (err) {
    if (err) throw err;
  });
};

var options = {
  url: 'http://192.168.1.1/connect.html',
  headers: {
    Authorization: 'Basic ' + new Buffer('modem_user:uTPkWaKutk8uGLEbk7UBvPVgEUdHnK').toString('base64')
  }
};

var regex = /var pppstatus='(.+)';/;

var fetchStatus = function () {
  request.get(options, function (err, res, body) {
    var status;
    if (err) {
      status = 'Off';
    } else {
      status = body.match(regex);
      status = status ? status[1] : 'Error';
    }
    saveResult(status);
  });
};

(function loop () {
  fetchStatus();
  setTimeout(loop, 1000 * 10);
}());
