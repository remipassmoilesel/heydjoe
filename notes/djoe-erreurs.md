# Erreurs possibles

* Envoi de message mais pas de réaction du serveur ? Erreurs 503 service unavailable ? Ou erreurs non expliquées juste après connexion:
 Envoyer une première présence au serveur pour signaler son activité !
 
    
    // signaler son activité au serveur 
    conn.send($pres())

* Openfire (à nouveau !) et OpenJDK. Etonnament, si le serveur Openfire démarre mais qu'il ne prend en charge aucun message,
c'est peut être du à l'utilisation d'OpenJDK 1.7. Une fois utilisant Oracle 1.8 ce comportement gênant à disparu.
Erreurs pt liées ? 

        2016.06.30 15:49:40 org.eclipse.jetty.server.HttpInput - java.lang.NoSuchMethodError: java.util.concurrent.ConcurrentHashMap.keySet()Ljava/util/concurrent/ConcurrentHashMap$KeySetView;
        2016.06.30 15:49:40 org.jivesoftware.openfire.http.HttpBindServlet - Error reading request data from [92.129.92.4]
        java.lang.NoSuchMethodError: java.util.concurrent.ConcurrentHashMap.keySet()Ljava/util/concurrent/ConcurrentHashMap$KeySetView;


* Openfire et pubsub: malgré que le servie principal possède un noeud pub sub, le service principal est capable 
de recevoir directement les requête pubsub (dont bookmarks)

* Le plugin caps fonctionne mal: voir la fonction ` _requestCapabilities: function (to, node, ver) {` qui enregistre un handler 
incorrect (pas d'id retourné par disco)

* erreurs en rapport avec les données stockées dans le localStorage: attention à la casse, certaines méthode du projet 
applique systèmatiquement un toLowerCase()

* perfect-scroll de dimension bizarre, sortant du cadre.
Voir le README sur Github.


    #container{ position: relative }

* JSXC Beaucoup d'erreur 404, icônes manquantes, etc ...:


    -> Corriger la variable root de jsxc.init({})

* npm install: gyp: /home/remipassmoilesel/.node-gyp/4.4.4/common.gypi not found


    -> Supprimer le dossier ~/.node-gyp et recommencer le build

* jsxc.js:5465 Uncaught TypeError: Cannot read property 'getUserItem' of undefined


    -> Ne pas utiliser jsxc.gui.template.get("menuWelcome") au mauvais moment
    