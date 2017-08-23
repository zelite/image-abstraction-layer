'use strict'
// server.js
// where your node app starts

// init project
var helmet = require("helmet");
var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var routes = require("./routes/index.js");


console.log("here");
mongo.connect(process.env.MONGO_DB, function(err, db) {
  if (err) {
    throw new Error("Database failed to connect.");
  } else {
    console.log("MongoDB connected successfully.");
  }

  //keep only the last 10 searches
  db.createCollection("searches", {
    capped: true,
    size: 5242880,
    max: 10
  });

  app.use(helmet());

  routes(app, db);

  var listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  });
});
