# Rejoindre un salon et le confgurer avec Strophe et le plugin MUC

/!\ Code spécial JSXC

* Envoyer une présence pour rejoindre le salon

    
    var self = jsxc.muc;
    
    // save room configuration in localstorage
    jsxc.storage.setUserItem('buddy', room, {
        jid: room,
        name: roomName || room,
        sub: 'both',
        type: 'groupchat',
        state: self.CONST.ROOMSTATE.INIT,
        subject: subject,
        bookmarked: bookmark || false,
        autojoin: autojoin || false,
        nickname: nickname,
        config: null
    });
    
    // join room
    jsxc.xmpp.conn.muc.join(room, nickname, null, null, null, password);
    
    // save bookmark
    if (bookmark) {
        jsxc.xmpp.bookmarks.add(room, roomName, nickname, autojoin);
    }
    
    
* A la reception de la stanza de presence de confirmation d'arrivée
(201: le salon vient d'être créé)
    
        <presence xmlns=​"jabber:​client" from=​"remi-20160615t084056595z@conference.im.silverpeas.net/​remi" 
            to=​"remi@im.silverpeas.net/​6h4p6vrmhd">​
            <x xmlns=​"http:​/​/​jabber.org/​protocol/​muc#user">​
                <item jid=​"remi@im.silverpeas.net/​6h4p6vrmhd" affiliation=​"owner" role=​"moderator">​</item>
                ​<status code=​"110"></status>
                ​<status code=​"100">​</status>
                ​<status code=​"201">​</status>​
            </x>​
        </presence>​
        
        // lancer la configuration
        self.conn.muc.configure(room, function (stanza) {
        
            // reception du formulaire, le modifier
        
            // pousser les parametres sur le seveur XMPP
            self.conn.muc.saveConfiguration(room, config, function () {
                    
                    // sauvegarder la configuration
                    jsxc.storage.updateUserItem('buddy', room, 'config', config);
                    
                }, function () {
                    
                    // Echec de l'envoi de la configuration
                    
                });
          
          
         }, function () {
             
            // Echec du chargement de la configuration
        
         });
         
         // ou annuler la configuration
         self.conn.muc.cancelConfigure(room);
         
* Formulaire d'Openfire
       
    
    
        <iq xmlns='jabber:client'
            type='result'
            id='d2a40f6d-ef0e-4abc-9958-e1c569623506:sendIQ'
            from='remi-20160615t123844404z@conference.im.silverpeas.net'
            to='remi@im.silverpeas.net/3c8xhckoqz'>
        <query xmlns='http://jabber.org/protocol/muc#owner'>
            <x xmlns='jabber:x:data'
               type='form'>
                <title>
                    Configuration du salon de discussion
                </title>
                <instructions>
                    Le salon de discussion "remi-20160615t123844404z" a été créé. Pour accepter la configuration par défaut,
                    cliquer sur le bouton "OK". Ou, modifier les paramètres en complétant le formulaire suivant :
                </instructions>
                <field var='FORM_TYPE'
                       type='hidden'>
                    <value>
                        http://jabber.org/protocol/muc#roomconfig
                    </value>
                </field>
                <field var='muc#roomconfig_roomname'
                       type='text-single'
                       label='Nom du Salon de Discussion'>
                    <value>
                        remi-20160615t123844404z
                    </value>
                </field>
                <field var='muc#roomconfig_roomdesc'
                       type='text-single'
                       label='Description'>
                    <value>
                        remi-20160615t123844404z
                    </value>
                </field>
                <field var='muc#roomconfig_changesubject'
                       type='boolean'
                       label='Autoriser les occupants à changer le sujet'>
                    <value>
                        0
                    </value>
                </field>
                <field var='muc#roomconfig_maxusers'
                       type='list-single'
                       label='Nombre Maximal d' Occupants>
                    <option label='10'>
                        <value>
                            10
                        </value>
                    </option>
                    <option label='20'>
                        <value>
                            20
                        </value>
                    </option>
                    <option label='30'>
                        <value>
                            30
                        </value>
                    </option>
                    <option label='40'>
                        <value>
                            40
                        </value>
                    </option>
                    <option label='50'>
                        <value>
                            50
                        </value>
                    </option>
                    <option label='Aucun'>
                        <value>
                            0
                        </value>
                    </option>
                    <value>
                        30
                    </value>
                </field>
                <field var='muc#roomconfig_presencebroadcast'
                       type='list-multi'
                       label='Rôles for lesquels la présence est propagée'>
                    <option label='Moderateur'>
                        <value>
                            moderator
                        </value>
                    </option>
                    <option label='Participant'>
                        <value>
                            participant
                        </value>
                    </option>
                    <option label='Visiteur'>
                        <value>
                            visitor
                        </value>
                    </option>
                    <value>
                        moderator
                    </value>
                    <value>
                        participant
                    </value>
                    <value>
                        visitor
                    </value>
                </field>
                <field var='muc#roomconfig_publicroom'
                       type='boolean'
                       label='Lister les Salons de Discussion dans le Répertoire'>
                    <value>
                        1
                    </value>
                </field>
                <field var='muc#roomconfig_persistentroom'
                       type='boolean'
                       label='Le Salon de Discussion est Persistant'>
                    <value>
                        1
                    </value>
                </field>
                <field var='muc#roomconfig_moderatedroom'
                       type='boolean'
                       label='Le Salon de Discussion est Modéré'>
                    <value>
                        0
                    </value>
                </field>
                <field var='muc#roomconfig_membersonly'
                       type='boolean'
                       label='Le Salon de Discussion est réservé aux membres'>
                    <value>
                        0
                    </value>
                </field>
                <field type='fixed'>
                    <value>
                        Note: par défaut, seuls les administrateurs peuvent envoyer des invitations dans un salon de discussion
                        réservé aux membres uniquement.
                    </value>
                </field>
                <field var='muc#roomconfig_allowinvites'
                       type='boolean'
                       label="Autoriser les Occupants à Inviter d'Autres Personnes">
                    <value>
                        1
                    </value>
                </field>
                <field var='muc#roomconfig_passwordprotectedroom'
                       type='boolean'
                       label='Mot de passe Requis pour entrer dans le salon de discussion'>
                    <value>
                        0
                    </value>
                </field>
                <field type='fixed'>
                    <value>
                        Si le mot de passe est requis pour entrer dans le salon de discussion, vous devrez saisir le mot de
                        passe ci-dessous.
                    </value>
                </field>
                <field var='muc#roomconfig_roomsecret'
                       type='text-private'
                       label='Mot de passe'/>
                <field var='muc#roomconfig_whois'
                       type='list-single'
                       label='Rôle permettant de découvrir les JIDs réels des Occupants'>
                    <option label='Moderateur'>
                        <value>
                            moderators
                        </value>
                    </option>
                    <option label="N'importe qui">
                        <value>
                            anyone
                        </value>
                    </option>
                    <value>
                        anyone
                    </value>
                </field>
                <field var='muc#roomconfig_enablelogging'
                       type='boolean'
                       label='Journaliser les Conversations du salon de discussion'>
                    <value>
                        1
                    </value>
                </field>
                <field var='x-muc#roomconfig_reservednick'
                       type='boolean'
                       label='Connexion uniquement avec surnom enregistré'>
                    <value>
                        0
                    </value>
                </field>
                <field var='x-muc#roomconfig_canchangenick'
                       type='boolean'
                       label='Autorisé les occupants à changer de surnoms'>
                    <value>
                        1
                    </value>
                </field>
                <field type='fixed'>
                    <value>
                        Autorisé les utilisateurs à s'inscrire dans le salon
                    </value>
                </field>
                <field var='x-muc#roomconfig_registration'
                       type='boolean'
                       label="Autorisé les utilisateurs à s'inscrire dans le salon">
                    <value>
                        1
                    </value>
                </field>
                <field type='fixed'>
                    <value>
                        Vous devriez indiquer les administrateurs de ce salon de discussion.Veuillez indiquer un JID par ligne.
                    </value>
                </field>
                <field var='muc#roomconfig_roomadmins'
                       type='jid-multi'
                       label='Administrateurs du Salon de Discussion'/>
                <field type='fixed'>
                    <value>
                        Vous devriez spécifier des propriétaires supplémentaires pour ce salon de discussion. Veuillez indiquez
                        un JID par ligne.
                    </value>
                </field>
                <field var='muc#roomconfig_roomowners'
                       type='jid-multi'
                       label='Propriétaires du Salon de Discussion'>
                    <value>
                        remi@im.silverpeas.net
                    </value>
                </field>
            </x>
        </query>
        </iq>
        
        
* Données JSXC ( jsxc.storage.getUserItem('buddy', room) )

        {
            "jid":"remi-20160615t123844404z@conference.im.silverpeas.net",
            "name":"remi, sebasti 15/6/2016",
            "sub":"both",
            "type":"groupchat",
            "state":1,
            "subject":"",
            "bookmarked":true,
            "autojoin":true,
            "nickname":"remi",
            "config":null,
            "status":5,
            "res":["remi"]
        }