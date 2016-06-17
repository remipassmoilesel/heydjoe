# Erreurs possibles

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