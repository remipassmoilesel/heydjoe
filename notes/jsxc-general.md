# Remarques générales sur JSXC

* Dépendances, images, son:


    # Ajouter une dépendance:
    # Ajouter le fichier dans JSXC/lib puis lancer Grunt.

    # Copie les dépendances dans dev
    $ grunt

    # copie les dépendances dans build
    $ grunt build:prerelease
    $ grunt build:release

    # Les images et sons sont également copiés de cette manière

* Déconnexion:


    jsxc.xmpp.logout(true); // 'true' retire l'interface de la page, false la laisse sur la page

