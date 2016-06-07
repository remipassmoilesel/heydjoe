# Remarques générales sur JSXC

* De la documentation est disponible dans jsxc/doc. La doc est générée
à l'appel de grunt build:release

* l'espace de nom jsxc contient des méthodes utilitaires comme log()

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

