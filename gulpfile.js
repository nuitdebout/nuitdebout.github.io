var gulp = require('gulp');
var _ = require('underscore');
var fs = require('fs');
var serve = require('gulp-serve');
var slug = require('slug');
var Handlebars = require('handlebars');

// Wiki Bot

var bot = require('nodemw');
var client = new bot({
  server: 'wiki.nuitdebout.fr',
  // path: 'api.php',
  debug: true
});

function getCities(callback)
{
  var cities = [];
  client.getArticle('Villes', function(err, article) {
    var matches = article.match(/\[\[([^\]]+)/g).forEach(function(city) {
      city = city.replace('[[', '');
      var pieces = city.split('|')
        , wiki_uri = pieces[0]
        , label = pieces[1];
      cities.push({
        slug: slug(label, {lower: true}),
        uri: '/ville/' + slug(label, {lower: true}),
        wiki_uri: wiki_uri,
        wiki_url: 'https://wiki.nuitdebout.fr/wiki/'+wiki_uri,
        links: [],
        label: label,
        name: label
      });
    });

    var agendaRegex = /== Calendrier ==([^=]+)/g;
    var linkRegex = /(https?:\/\/[^ }=\r\n]+)/g;

    function getCityDetails(city, cb) {
      client.getArticle(city.wiki_uri, function(err, cityArticle) {
        var matches;
        if (matches = linkRegex.exec(cityArticle)) {
          matches.forEach(function(link) {
            city.links.push(link);
          });
        }
        city.links = _.uniq(city.links);
        cb(city);
      });
    }

    function eachAsync(arr, func, cb) {
      var doneCounter = 0,
        results = [];
      arr.forEach(function (item) {
        func(item, function (res) {
          doneCounter += 1;
          results.push(res);
          if (doneCounter === arr.length) {
            cb(results);
          }
        });
      });
    }

    eachAsync(cities, getCityDetails, function(results) {
      callback.apply(undefined, [results]);
    });
  });
}

function getLastReports(callback)
{
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  client.getRecentChanges(yesterday.getTime(), function(err, changes) {
    var titles = []
      , matches = [];
    changes.forEach(function(change) {
      if (change.type == 'new' && (change.title.match(/Villes\/.*\/CR/g) || change.title.match(/Villes\/.*\/AG/g))) {
        var label, city;
        if (matches = /^Villes\/([^\/]+)/g.exec(change.title)) {
          city = matches[1];
        }
        if (matches = /.*\/(.*)$/g.exec(change.title)) {
          label = matches[1];
        }
        if (city && label) {
          titles.push({
            url: 'https://wiki.nuitdebout.fr/wiki/'+change.title,
            city: city,
            label: label
          });
        }
      }
    });
    callback.apply(undefined, _.uniq([titles]));
  })
}

/**
 * Retrieves the list of cities from the wiki and creates a JSON file.
 */
gulp.task('import:cities', function(cb) {

  getCities(function(newCities) {

    var currentCities = JSON.parse(fs.readFileSync('data/cities.json').toString());

    // Merge links
    var cities = newCities.map(function(newCity) {
      var currentCity = _.find(currentCities, function(currentCity) {
        return currentCity.slug === newCity.slug;
      })
      if (currentCity) {
        newCity.links = _.uniq(currentCity.links.concat(newCity.links));
      }
      return newCity;
    });

    fs.writeFile('data/cities.json', JSON.stringify(cities, null, 2), function(err) {
      if (err) {
        return console.log(err);
      }
      cb();
    });
  });

});

gulp.task('import:reports', function() {

  getLastReports(function(titles) {
    fs.writeFile('data/reports.json', JSON.stringify(titles, null, 2), function(err) {
      if (err) {
        return console.log(err);
      }
    });
  });

});

gulp.task('import', ['import:cities', 'import:reports']);

/**
 * Generates the index.html file using Handlebars.
 */
gulp.task('website', function() {

  Handlebars.registerPartial('header', fs.readFileSync('templates/partials/header.hbs').toString());
  Handlebars.registerPartial('footer', fs.readFileSync('templates/partials/footer.hbs').toString());

  var tplIndex = Handlebars.compile(fs.readFileSync('templates/index.hbs').toString());
  var tplCity = Handlebars.compile(fs.readFileSync('templates/city.hbs').toString());

  var cities = JSON.parse(fs.readFileSync('data/cities.json').toString());
  var reports = JSON.parse(fs.readFileSync('data/reports.json').toString());

  // Create an array of arrays of 2 cities
  var citiesTwoPerLine = [];
  var arrayOfTwo = [];
  cities.forEach(function(city) {
    if (arrayOfTwo.length < 2) {
      return arrayOfTwo.push(city);
    }
    citiesTwoPerLine.push(arrayOfTwo);
    arrayOfTwo = [];
    arrayOfTwo.push(city);
  });

  var data = {
    citiesTwoPerLine: citiesTwoPerLine,
    cities: cities,
    reports: reports
  };

  fs.writeFileSync('index.html', tplIndex(data));

  cities.forEach(function(city) {
    var dir = './ville/' + slug(city.label, {lower: true});
    var file = dir + '/index.html';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    fs.writeFileSync(file, tplCity({city: city}));
  })
});

gulp.task('watch', function() {
  gulp.watch(['templates/*.hbs', 'templates/partials/*.hbs'], ['website'])
});

gulp.task('serve', ['watch'], serve('./'));
