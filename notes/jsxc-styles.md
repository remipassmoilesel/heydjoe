# Notes sur les styles

* Utilise SASS. Compilé et surveillé par Grunt:


    $ ./grunt-dev.sh

* Les instructions image-url("...") sont remplacées
le chemin original de l'image à l'appe lde Grunt:


    image-url("menu_black.svg")

* Le fichier principal `jsxc.scss` ne contient que des imports sous
la forme:


    @import "menu";
    /* importe ./_menu.scss */