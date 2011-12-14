
/**
 * Module dependencies.
 */

var Factory = require('./factory.js').Factory;
var form = require('connect-form');
var events = require('events');
var express = require('express');
var mongoose = require('mongoose');
var routes = require('./routes');

var app = module.exports = express.createServer(
  form({ keepExtensions: true })
);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Start the hub factory.
mongoose.connect('mongodb://localhost/pubhub');
mongoose.connection.on('error', function(err) {
  console.error(err);
});
var factory = new Factory();
var hubEvents = new events.EventEmitter();
hubEvents.on('subscribed', function onSubscribed(query) {
  factory.subscribe(query);
});
hubEvents.on('published', function onPublished(feed) {
  factory.publish(feed);
});

// Routes
app.get('/', routes.index);
app.get('/subscribe', function onGet(req, res) {
  res.send('Only POST subscriptions are supported.');
});
app.post('/subscribe', function onSubscribe(req, res) {
  routes.subscribe(req, res, hubEvents);
});
app.post('/publish', function onPublish(req, res) {
  routes.publish(req, res, hubEvents);
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
