'use strict';
var querystring = require("querystring");
var https = require("https");

//Builds query string from search items and offset parameter
function buildQuery(searchItems, offset) {
  var start = 1;
  if (isNaN(offset) === false && offset !== 0) {
    start = offset * 10 + 1;
  }
  var query = process.env.API_URL + querystring.stringify({
    cx: process.env.SEARCH_ENGINE_ID,
    q: searchItems,
    key: process.env.API_KEY,
    searchType: "image",
    safe: "medium",
    start: start
  })
  //console.log(query);
  return query;
}

//Builds search response by processing each response item
function buildSearchResponse(objectFromGoogleAPI) {
  var items = objectFromGoogleAPI.items
  return items.map(buildResponseItem);
}

//parses the response item information to only output what we want
function buildResponseItem(responseItem) {
  return {
    "url": responseItem.link,
    "snippet": responseItem.snippet,
    "thumbnail": responseItem.image.thumbnailLink,
    "context": responseItem.image.contextLink
  }
}

function recordSearchInDb(searchItems, db) {
  var searches = db.collection("searches");
  var when = new Date();
  searches.insertOne({
    term: searchItems,
    when: when
  }, function(err, result) {
    console.log(err);
    console.log(result);
  })
}

function getLastSearches(db, response) {
  var searches = db.collection("searches");
  searches.find({}, {
    _id: 0
  }).sort({
    when: -1
  }).toArray(function(err, items) {
    response.json(items);
  });
}

module.exports = function(app, db) {
  app.get("/", function(request, response) {
    response.sendFile(process.cwd() + "/views/index.html");
  })
  // http://expressjs.com/en/starter/basic-routing.html
  app.get("/api/imagesearch/:searchitems", function(request, response) {
    var searchTerms = request.params.searchitems;
    var offset = Number(request.query.offset);
    https.get(buildQuery(searchTerms, offset), (res) => {
        if (res.statusCode === 200) {
          res.setEncoding('utf8');
          var data = [];
          res.on('data', (chunk) => {
            data.push(chunk);
          });
          res.on('end', () => {
            response.json(buildSearchResponse(JSON.parse(data.join(""))));
            recordSearchInDb(searchTerms, db);
          });
        } else {
          response.status(res.statusCode).json({
            error: "could not get a result from the Google Search API."
          });
        }
      }

    );
  })

  app.get("/api/latest", function(request, response) {
    getLastSearches(db, response);
  });

  app.get("/api/*", function(request, response) {
    response.status(404).json({
      error: "invalid command. Go to https://whip-flame.glitch.me/ for help how to use the API."
    });
  });
}
