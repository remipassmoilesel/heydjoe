# Mettre en place l'environnement de développement de JSXC

*/!\ Nécéssite l'utilisation de Node 4 stable (testé avec 4.4.4)*

Téléchargements:
* https://nodejs.org/dist/v4.4.5/node-v4.4.5-linux-x64.tar.xz
* https://nodejs.org/en/download/releases/

Source: https://github.com/jsxc/jsxc/wiki/Developer-notes

* Installer JSXC et ses dépendances:


    # Installer Node 4 et l'ajouter au PATH
    $ export PATH=$PATH:/path/to/node4/bin/

    # Cloner et mettre à jour les dépendances en sous module Git
    $ git clone https://github.com/jsxc/jsxc/
    $ cd jsxc/
    $ git submodule update --init

    # Installer Grunt
    $ npm install -g grunt-cli bower

    # Installer les dépendances
    # En cas d'erreur, il s'agit surement de la version de node
    $ npm install
    $ bower install

    # Si ce message d'erreur apparait:
    # gyp: /home/remipassmoilesel/.node-gyp/4.4.4/common.gypi not found
    #    >>> supprimer le dossier ~/.node-gyp et recommencer le build

    # Lancement de la chaine de compilation
    $ grunt

* Activer le mode debuggage:


    // Dans la console du navigateur:
    jsxc.storage.setItem('debug', true)

* Commandes Grunt:


    # construire dans dev/ et surveiller les changements
    $ grunt

    # construire dans build/ mais sans maj de la documentation
    $ grunt build:prerelease

    # construire dans build/
    $ grunt build:release



