# Erreurs possibles

###JSXC Beaucoup d'erreur 404, icônes manquantes, etc ...:

    -> Corriger la variable root de jsxc.init({})

###npm install: gyp: /home/remipassmoilesel/.node-gyp/4.4.4/common.gypi not found

    -> Supprimer le dossier ~/.node-gyp et recommencer le build

###jsxc.js:5465 Uncaught TypeError: Cannot read property 'getUserItem' of undefined

    -> Ne pas utiliser jsxc.gui.template.get("menuWelcome") au mauvais moment