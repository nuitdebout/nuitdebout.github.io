# nuitdebout.github.io

Ce repository contient le HTML de la page principale de www.nuitdebout.fr.

# Documentation

Retrouvez-nous sur https://chat.nuitdebout.fr/ sur le canal #nuitdebout.fr

Roadmap : https://tableau.nuitdebout.fr/b/GcgxXW246HeRZBRpo/site-nuitdebout

Wiki : http://wiki.nuitdebout.fr/

# Développement

Pour l'instant le site est un simple fichier `index.html`.

Des commandes permettent de générer le fichier `index.html` à partir de fichiers templates.

### import:cities

Cette tâche permet d'importer les villes et leurs informations depuis le Wiki, et met à jour le fichier `data/cities.json`

```
$ gulp import:cities
```

### website

La tâche `website` permet de générer un fichier `index.html` à jour, ainsi que les mini-sites des villes.

```
$ gulp website
```

Installer Node, Gulp et les dépendances, puis lancer le serveur local.
Le fichier `index.html` est régénéré à chaque changement des templates.

```
$ npm install --global gulp-cli
$ npm install
$ gulp serve
```

