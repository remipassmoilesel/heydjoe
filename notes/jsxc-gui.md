# JSXC: notes sur l'interface

* Tous les templates sont accessible dans:


    jsxc.gui.template.get("roster") // pour roster.html
    jsxc.gui.template.get = function(name, bid, msg) {


* Internationalisation: utilisation de Jquery / i18n


    $.i18n( 'message_hello' ); // obtenir le message
    <li class="jsxc_settings jsxc_settingsicon" data-i18n="Settings"></li> // insérer du texte dans du HTML

* L'affichage et le masquage des menus se fait grâce à jsxc.gui.togglelist.
La fonction ajoute une fonctionnalité de masquage avec animation à un élement


    toggleList: function(el) {

* Le roster est controlé dans l'espace de nom:


    jsxc.gui.roster


* L'état du GUI et enregistré dans:


    jsxc.storage.getUserItem('roster') // pour le roster
    .....

* Template de barre de coté avec menus, contacts, ...:


    templates/roster.html

* Les clics sur le menu sont écoutés de cette manière:


    $('#jsxc_menu .jsxc_hideOffline').click(function() {