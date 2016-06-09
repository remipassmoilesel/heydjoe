# Remarques générales sur JSXC

* Utilitaires:


    jsxc.stackTrace() // print stack trace
    jsxc.xmpp.getLocaleBuddyListBJID() // array of local buddies
    jsxc.el_exists($("#selector")); // check if element exist
    jsxc.jidToBid(item); // get bare jid 

* Liste d'utilisateurs amis. La liste d'utilisateurs est normalement demandée au serveur puis stockée en local.

    
    // Une méthode à été créé pour récupérer une liste de bare JID
     jsxc.getLocaleBuddyListBJID()
    
    // Demande au serveur
    jsxc.xmpp.onRoster: function (iq) {
    jsxc.xmpp.onRosterChanged: function (iq) {
    
    // accès en local
    var buddies = jsxc.storage.getUserItem('buddylist');
    
    // evenements générés lors du premier chargement
    cloaded.roster.jsxc
    
    // evenement lors de l'ajout ET DE LA SUPPRESSION d'un ou plusieurs amis
    add.roster.jsxc
    
    Pas d'evenement à la mise à jour ? (jsxc.xmpp.onRosterChanged)
    


* Les modules sont généralement initialisés en fin de fichier à l'aide d'un bloc de la forme:


    $(document).ready(function() {
        $(document).on('init.window.jsxc', jsxc.webrtc.initWindow);
        $(document).on('attached.jsxc', jsxc.webrtc.init);
        $(document).on('disconnected.jsxc', jsxc.webrtc.onDisconnected);
        $(document).on('connected.jsxc', jsxc.webrtc.onConnected);
    });

* L'initialisation d'un module se fait généralement à la réception de l'evenement JQuery "attached.jsxc", envoyé après connexion XMPP.
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

