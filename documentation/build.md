# Contruire le projet Djoe













Pour construire le projet:

        # Cloner le projet à partir de Github
        $ git clone https://github.com/remipassmoilesel/djoe
        $ cd djoe
        
        # Ajouter les dépendances de développement
        $ npm install
        
        # Ajouter les dépendances du site de démonstration
        $ cd var/www/djoe/
        $ bower install
        
        # Construire JSXC
        $ cd var/www/djoe/jsxc
        $ npm install
        