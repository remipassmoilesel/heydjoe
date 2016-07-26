# Installation de Djoe

* Installer et paramétrer MariaDB:


    $ sudo apt-get update && sudo apt-get install mariadb-server
    $ service mysql start
    $ mysql_secure_installation
    $ mysql -u root -p
    > CREATE DATABSE openfire
    > GRANT ALL ON openfire.* TO openfire@localhost IDENTIFIED BY '...';

* Installer et démarrer Openfire:


    $ cd /opt/
    $ sudo wget http://www.igniterealtime.org/downloadServlet\?filename\=openfire/openfire_4_0_2.tar.gz -O openfire.tar.gz
    $ sudo tar -xf openfire.tar.gz
    $ sudo /opt/openfire/bin/openfire start

* Puis se rendre à l'url http://domain:9090 pour compléter l'assistant de paramétrage.
* Une fois l'assistant terminé:
    * Dans "Serveur / Paramètres du serveur / Inscription et authentification":
        * Désactiver "Inscription de compte via Jabber client"
        * Désactiver "Changer le mot de passe"
        * Désactiver "Connexion anonyme"
        * Puis sauvegarder.
    * "Serveur / Parametres du serveur / Connexions client" Idle connections Policy > 120s

    * "Message hors connexion" > 2000 KB

    * Dans "Plugins > Plugins" disponibles installer:
        * DB Access
        * Just married
        * REST API

    * Dans "Salon de discussion" > "Paramètres de salon de discussion" > "Services options"
        * \+ Make room persistent
        * \+ Allowoccupants to invite others


* Puis configurer le serveur pour TLS. Toutes les étapes sont indispensables (même si vous ne voulez pas de mot de passe
sur la clef privée):


    # ajouter un mot de passe à la clef privée
    $ cd /etc/ssl
    $ sudo openssl rsa -aes256 -in srvstage.key -out srvstage.key.pwd

    # changer le mot de passe et mettre le meme mot de passe que la clef privée
    $ cd /opt/openfire/resources/security
    $ sudo keytool -storepasswd -keystore keystore

    # Lister et supprimer les anciennes clefs
    $ keytool -list -keystore keystore
    $ keytool -delete -keystore keystore -alias lesurvivantdelamort_rsa
    $ keytool -delete -keystore keystore -alias lesurvivantdelamort_dsa
    $ java KeyStoreImport keystore test-messagerie.ddns.net.crt.der test-messagerie.ddns.net.key.der "test-messagerie.ddns.net"

    Redémarrer le serveur
    Puis ensuite changer tous les mots de passe "identity store" de magasin de l'interface web
    Puis redémarrer le serveur

* Installer et configurer Apache 2:


    $ sudo apt-get install apache2
    $ cp config/etc.apache2.sites-available.im.silverpeas.net.conf /etc/apache2/sites-available/im.silverpeas.net.conf
    $ sudo a2ensite im.silverpeas.net.conf
    $ sudo apache2 restart

* _TODO: Ajouter des notes sur l'installation des certificats intermédiaires_

* Installer node4:


    $ cd /opt/
    $ wget .... -O nodejs4.tar.gz
    $ tar -xf nodejs4.tar.gz

* Cloner djoe dans /var/www/


    $ cd /var/www
    $ git clone http://github.com/remipassmoilesel/djoe
    $ sudo chown -R www-data:www-data djoe/
    $ sudo chmod -R g+rw djoe/
    $ sudo usermod -aG www-data user

    $ cd djoe/var.www.djoe/
    $ export PATH=$PATH:/opt/nodejs4/bin
    $ npm install
    $ bower install

    # Si ce message d'erreur apparait:
    # gyp: /home/remipassmoilesel/.node-gyp/4.4.4/common.gypi not found
    #     >>> supprimer le dossier ~/.node-gyp et recommencer le build


* TODO: Modification des systèmes de pare feu pour autoriser le trafic UDP par les ports utilisés

* TODO: Installation de coturn





