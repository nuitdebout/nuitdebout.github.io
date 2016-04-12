var gulp = require('gulp');
var _ = require('underscore');
var fs = require('fs');
var serve = require('gulp-serve');
var bot = require('nodemw');
var client = new bot({
  server: 'wiki.nuitdebout.fr',
  path: '/api.php',
  debug: true
});
var Handlebars = require('handlebars');

function getCities(callback)
{
  var cities = [];
  client.getArticle('Villes', function(err, article) {
    var matches = article.match(/\[\[([^\]]+)/g).forEach(function(city) {
      city = city.replace('[[', '');
      var pieces = city.split('|')
        , uri = pieces[0]
        , label = pieces[1];
      cities.push({
        uri: uri,
        url: 'https://wiki.nuitdebout.fr/index.php?title='+uri,
        label: label
      });
    });
    callback.apply(undefined, [cities]);
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
            url: 'https://wiki.nuitdebout.fr/index.php?title='+change.title,
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
gulp.task('import:cities', function() {

  getCities(function(cities) {
    // console.log(cities);
    fs.writeFile('data/cities.json', JSON.stringify(cities, null, 2), function(err) {
      if (err) {
        return console.log(err);
      }
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

  var index = Handlebars.compile(fs.readFileSync('templates/index.hbs').toString());
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
    cities: citiesTwoPerLine,
    reports: reports
  };

  fs.writeFile('index.html', index(data), function(err) {
    if (err) {
      return console.log(err);
    }
    console.log('Website generated !')
  });
});

gulp.task('watch', function() {
  gulp.watch(['templates/*.hbs'], ['website'])
});

gulp.task('serve', ['watch'], serve('./'));
