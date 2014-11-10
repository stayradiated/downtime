var fs      = require('fs');
var request = require('request');
var blessed = require('blessed');
var Canvas  = require('drawille');
var cli     = require('commander');

cli
  .option('-a, --auth [authstring]', 'The username and password joined with a colon "username:password"', 'admin:admin')
  .option('-i, --ip [ip]', 'The IP address of the modem', '192.168.1.1')
  .version(require('./package').version)
  .parse(process.argv);

var state = {
  status: 'Off',
  chart: [],
};

var screen = blessed.screen();

var graph = blessed.box({
  label: ' Internet Status ',
  top: 'center',
  left: 'center',
  width: '100%',
  height: '100%',
  content: '',
  tags: false,
  border: {
    type: 'line'
  },
  style: {
    fg: '#f43059',
    border: {
      fg: 'white'
    },
  },
});

screen.append(graph);
graph.focus();
screen.render();

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

var regex = /var pppstatus='(.+)';/;

function parseStatus () {
  var mod = 0;

  if (state.changed) {
    storeStatus(mod);
    return
  }

  switch (state.status) {
    case 'Off':
      mod = 0;
      break;
    case 'Error':
    case 'Authentication Failure':
      mod = 0.2;
      break;
    case 'PPP Down':
      mod = 0.4;
      break;
    case 'ADSL Link Down':
      mod = 0.6;
      break;
    case 'Up':
      mod = 1;
      break;
  }

  var noise = 0.1;
  mod += (Math.random()*noise) - (noise/2);
  mod = ((state.chart[0]||mod) + (state.chart[1]||mod) + (state.chart[2]||mod) + mod) / 4;

  if (mod < 0) { mod = 0; }
  else if (mod > 1) { mod = 1; }

  storeStatus(mod);
}

function storeStatus (mod) {
  state.chart.unshift(mod);
  if (state.chart.length > 500) { // max width
    state.chart.pop();
  }
}

function drawChart () {
  var width = (graph.width - 3) * 2;
  var height = (graph.height - 2) * 4;
  var canvas = new Canvas(width, height);

  for (var x = 0, len = state.chart.length; x < len; x++) {
    var mod = state.chart[x];

    for (var y = 0; y < height * mod; y++) {
      canvas.set(width - x, height - y);
    }
  }

  graph.setContent(canvas.frame());
  screen.render();
};


var options = {
  url: 'http://' + cli.ip + '/connect.html',
  headers: {
    Authorization: 'Basic ' + new Buffer(cli.auth).toString('base64')
  }
};

function fetchStatusLoop () {

  request.get(options, function (err, res, body) {
    var status;

    if (err) {
      status = 'Off';
    } else {
      status = body.match(regex);
      status = status ? status[1] : 'Error';
    }

    state.changed = (state.status != status);
    state.status = status;

    setTimeout(fetchStatusLoop, 1000);
  });
};

fetchStatusLoop();

(function loop () {
  parseStatus();
  drawChart();
  setTimeout(loop, 500);
}());
