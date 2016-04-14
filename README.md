# nuitdebout.github.io

Ce repository contient le HTML de la page principale de www.nuitdebout.fr.

# Documentation

Retrouvez-nous sur https://chat.nuitdebout.fr/

Roadmap : https://tableau.nuitdebout.fr/b/GcgxXW246HeRZBRpo/site-nuitdebout

Wiki : http://wiki.nuitdebout.fr/

# Développement

Pour l'instant le site est un simple fichier `index.html`.

Des commandes permettent de générer le fichier `index.html` à partir de fichiers templates.

La tâche `import` permet de récupérer des données du Wiki et les stocker dans des fichiers JSON.

```
$ gulp import
```

La tâche `website` permet de générer un fichier `index.html` à jour.

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

# Faire tourner le site sur sa machine

- Avec PHP

```
$ cd nuitdebout.github.io
$ php -S localhost:8000
Listening on http://localhost:8000
```

- Avec Node.JS

```
$ cd nuitdebout.github.io
$ npm install -g http-server
$ http-server
Starting up http-server, serving ./
Available on:
  http://127.0.0.1:8080
  http://192.168.1.81:8080
  http://10.10.10.1:8080
  http://192.168.0.1:8080
```

