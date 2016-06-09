# Remarques générales sur JSXC

jsxc.el_exists($("#selector"));

* Les modules sont généralement initialisés en fin de fichier à l'aide d'un bloc de la forme:


    $(document).ready(function() {
        $(document).on('init.window.jsxc', jsxc.webrtc.initWindow);
        $(document).on('attached.jsxc', jsxc.webrtc.init);
        $(document).on('disconnected.jsxc', jsxc.webrtc.onDisconnected);
        $(document).on('connected.jsxc', jsxc.webrtc.onConnected);
    });

* L'initialisation d'un module se fait généralement à la réception de l'evenement JQueqy "attached.jsxc", envoyé après connexion.
Il est possible de s'inspirer par exemple du module webrtc

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

