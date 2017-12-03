var child   = require('child_process');
var split   = require('split');
var blessed = require('blessed');
var Canvas  = require('drawille');
var cli     = require('commander');
var isWindows = require('is-windows');

cli
  .option('-i, --ip [ip]', 'The IP address to ping', '8.8.8.8')
  .option('-s, --size [packetsize]', 'Size of packets to send', '16')
  .version(require('./package').version)
  .parse(process.argv);

var state = {
  status: 0,
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

function storeStatus (value) {
  state.chart.unshift(value);
  if (state.chart.length > 500) { // max width
    state.chart.pop();
  }
}

function drawChart () {
  var width = (graph.width - 3) * 2;
  var height = (graph.height - 2) * 4;
  var canvas = new Canvas(width, height);

  var len = state.chart.length;
  var max = 0;

  for (var i = 0; i < len; i++) {
    if (state.chart[i] > max) {
      max = state.chart[i];
    }
  }

  max += 10;

  for (var x = 0; x < len; x++) {
    var value = state.chart[x] / max * height;

    for (var y = 0; y < value; y++) {
      canvas.set(width - x, height - y);
    }
  }

  graph.style.fg = lastStatus === ERROR_STATUS ? '#fff' : '#f43059';
  graph.setContent(canvas.frame());
  screen.render();
};

var ping
if (isWindows()) {
  ping = child.spawn('ping', ['-t', '-l', cli.size, cli.ip])
} else {
  ping = child.spawn('ping', ['-s', cli.size, cli.ip]);
}
var ERROR_STATUS = 1;
var lastStatus = ERROR_STATUS;

ping.stdout.pipe(split()).on('data', function (buffer) {
  var line = buffer.toString();
  var match = line.match(/time=([\d\.]+)/i);
  lastStatus = match ? parseInt(match[1], 10) : ERROR_STATUS;
  reset();
});

ping.stderr.on('data', function (buffer) {
  lastStatus = ERROR_STATUS;
});

(function loop () {
  storeStatus(lastStatus);
  drawChart();
  setTimeout(loop, 500);
}());

function reset () {
  clearTimeout(_reset);
  _reset = setTimeout(function () { lastStatus = ERROR_STATUS; }, 1000);
}
var _reset = setTimeout(reset, 0);
