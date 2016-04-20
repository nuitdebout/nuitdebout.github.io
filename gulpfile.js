var gulp = require('gulp');
var _ = require('underscore');
var fs = require('fs');
var serve = require('gulp-serve');
var slug = require('slug');
var Handlebars = require('handlebars');
var Sitemap = require('sitemap');

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

var callSlugs = {
  "ca": "crida-internacional-de-nuit-debout",
  "el": slug("Διεθνές-Κάλεσμα-του-κινήματος-nuit-debout", {lower: true}),
  "en": "international-call-by-nuit-debout",
  "es": "llamada-internacional-de-nuit-debout",
  "it": "appello-internazionale-di-nuit-debout",
  "fr": "appel-international-de-nuit-debout",
  "hr": "Pozivamo-na-GLOBALDEBOUT",
  "rs": "meunarodni-poziv-nuitdebout",
  "ro": "APEL-INTERNAȚIONAL-PENTRU-NUITDEBOUT",
  "sq": "THIRRJE-NDERKOMBETARE-PER-NUITDEBOUT", 
  "de": "internationaler-Aufruf-von-NuitDebout"
}

gulp.task('sitemap', function() {

  var cities = JSON.parse(fs.readFileSync('data/cities.json').toString());

  var urls = [
    {url: '/', changefreq: 'daily'}
  ];

  _.each(callSlugs, function(slug, language) {
    var uri = ((language === 'fr' ? '/'+slug : '/'+language+'/'+slug)+'.html')
    urls.push({url: uri, changefreq: 'daily'});
  })

  var citiesURLs = cities.map(function(city) {
    return {
      url: '/ville/' + city.slug,
      changefreq: 'daily'
    }
  });

  urls = urls.concat(citiesURLs);

  var sitemap = Sitemap.createSitemap ({
    hostname: 'http://www.nuitdebout.fr',
    urls: urls
  });

  fs.writeFileSync('./sitemap.xml', sitemap.toString());
});

/**
 * Generates the index.html file using Handlebars.
 */
gulp.task('website', ['website:international'], function() {

  Handlebars.registerPartial('header', fs.readFileSync('templates/partials/header.hbs').toString());
  Handlebars.registerPartial('footer', fs.readFileSync('templates/partials/footer.hbs').toString());

  var tplIndex = Handlebars.compile(fs.readFileSync('templates/index.hbs').toString());
  var tplCity = Handlebars.compile(fs.readFileSync('templates/city.hbs').toString());

  var cities = JSON.parse(fs.readFileSync('data/cities.json').toString());
  var reports = JSON.parse(fs.readFileSync('data/reports.json').toString());
  var websites = JSON.parse(fs.readFileSync('data/websites.json').toString());

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
    reports: reports,
    callSlugs: callSlugs
  };

  fs.writeFileSync('index.html', tplIndex(data));

  cities.forEach(function(city) {
    var dir = './ville/' + slug(city.label, {lower: true});
    var file = dir + '/index.html';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    var hasOwnWebsite = websites.hasOwnProperty(city.slug)
      , websiteURL = hasOwnWebsite ? websites[city.slug] : undefined;

    var tpl = tplCity;
    if (fs.existsSync('./templates/cities/'+city.slug+'.hbs')) {
      tpl = Handlebars.compile(fs.readFileSync('./templates/cities/'+city.slug+'.hbs').toString());
    }

    city = _.extend(city, {
      hasOwnWebsite: hasOwnWebsite,
      websiteURL: websiteURL
    });

    fs.writeFileSync(file, tpl({
      city: city
    }));
  })
});

gulp.task('website:international', function() {

  Handlebars.registerPartial('header', fs.readFileSync('templates/partials/header.hbs').toString());
  Handlebars.registerPartial('footer', fs.readFileSync('templates/partials/footer.hbs').toString());

  var files = fs.readdirSync('./templates/international').forEach(function(filename) {
    var tplLanguage = Handlebars.compile(fs.readFileSync('./templates/international/'+filename).toString());
    var language = filename.replace('.hbs', '');
    if (!fs.existsSync(language)) {
      fs.mkdirSync(language);
    }
    if (callSlugs.hasOwnProperty(language)) {
      var slug = callSlugs[language];
      if (language === 'fr') {
        fs.writeFileSync('./'+slug+'.html', tplLanguage({}));
      } else {
        fs.writeFileSync('./'+language+'/'+slug+'.html', tplLanguage({}));
      }

    }
  });

});

gulp.task('watch', function() {
  gulp.watch(['templates/*.hbs', 'templates/partials/*.hbs', 'templates/international/*.hbs'], ['website'])
});

gulp.task('serve', ['watch'], serve('./'));
