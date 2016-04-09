require('env2')('config.env');
var request = require('request'),
express = require('express'),
compression = require('compression'),
Twitter = require('twitter'),
cors = require('cors');

var app = express();                 // define our app using express

var port = process.env.PORT || 3000;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// app.use(function(req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   return next();
// });

app.use(compression());

router.get('/bambuser', function(req, res) {
  var options = {
    uri: 'http://api.bambuser.com/broadcast.json',
    qs: {
      api_key: process.env.BAMBUSER_APIKEY,
      tag: 'NuitDeboutLive',
      type: 'live'
    }
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {

      body = JSON.parse(body);

      if (body.result && !body.result.length)
      {

        delete options.qs.type;

        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {

            res.json(body);

          }
        });

      }
      else
      {
        res.json(body);
      }

    }
  });
});


router.get('/facebook', function (req, res) {

  var options = {
    uri: 'https://graph.facebook.com/1707017119576184/posts',
    qs: {
      access_token: process.env.FACEBOOK_ACCESS_TOKEN,
      fields: 'message,caption,full_picture,link'
    }
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {

      body = JSON.parse(body);
      res.setHeader('Content-Type', 'application/json');
      res.json(body);

    }
  });

});

router.get('/twitter', function (req, res) {

  var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

  var params = {screen_name: 'nuitdebout'};
  client.get('statuses/user_timeline', params, function (error, tweets, response) {
    if (!error) {
      res.json(tweets);
    }
  });
});

// Enable CORS access
var corsOptions = {
  origin: process.env.CORS_ALLOWED_URL
};

app.use(cors(corsOptions));

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
var server = app.listen(port);
server.timeout = 5000;
