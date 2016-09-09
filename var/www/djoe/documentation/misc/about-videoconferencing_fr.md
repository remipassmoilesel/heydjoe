# A propos de la vidéoconférence

Le fonctionnement de la vidéo conférence peut paraitre trivial mais permet un fonctionnement simple sans infrastructure supplémentaire autre que celle nécéssaire aux communications multimédia WebRTC en paire à paire. 

Le système de vidéoconférence utilise l'extension Jingle (XEP 0166) pour établir des sessions multimédia mais ne respecte pas de XEP particulière pour ce qui est des invitations.

Le système de vidéconférence décrit ci-dessous utilise exclusivement des identifiants Jabber complets.

## Principe
La vidéoconférence s'effectue en paire à paire entre chacun des clients. Chaque client reçoit une invitation de l'initiateur avec la liste de tous les clients participants, et détermine quels clients il doit contacter pour que tout le monde reçoive un flux entrée et un flux sortie de chaque client. 

Un client qui contacte un autre client initie une session Jingle avec lui, dans le but d'accéder à un flux audio et vidéo distant et de transmette un flux audio et vidéo local.

**Choix des clients à appeler:**

Exemple de l'utilisateur b@domain/res, qui initie une vidéoconférence avec a@domain/res, c@domain/res et d@domain/res. Chaque utilisateur reçoit une invitation contenant ces informations:

* b@domain/res: Initiateur 
* a@domain/res: Participant 1 
* c@domain/res: Participant 2
* d@domain/res: Participant 3

Chaque client doit ensuite:

* créer une liste avec l'initiateur et tous les clients,
* trier la liste par ordre alphabétique,
* puis la doubler

Ce qui donne dans notre exemple:

        [
         a@domain/res,   
         b@domain/res, // initiateur
         c@domain/res,
         d@domain/res,
         a@domain/res,
         b@domain/res, // initiateur 
         c@domain/res,
         d@domain/res
        ]
         

A partir de cette liste chaque client peut déterminer quels clients il doit contacter. L'initiateur contacte tous les clients, et chaque client doit contacter tous les clients de cette liste situés entre la première occurence du client appelant et la prochaine occurence de l'initateur.

La liste des sessions Jingle à initier par un client est appelée `liste de sessions`.

Ce qui donne pour notre exemple la séquence suivante:
 
1. b@domain/res, l'initiateur, devra contacter `c`, `d` et `a`
1. c@domain/res devra contacter `d` et `a`
1. d@domain/res devra contacter `a`
1. a@domain/res ne devra contacter personne

![Principe de vidéo conférence en paire à paire](https://raw.githubusercontent.com/remipassmoilesel/djoe/master/documentation/notes/videoconference.png "Principe de vidéo conférence en paire à paire")

## Messages

Les messages utilisés sont dérivés de la stanza XMPP `message` permettant d'envoyer à n'importe quel utilisateur un message texte ou plus de données si nécéssaire.

Les messages utilisés ci-dessous ont toujours ces caractéristiques:
* Les clients y sont représentés par leurs fulljid (identifiant Jabber complet, avec ressource)
* Les clients sont de deux types:
  * un client est initiateur, il prend l'initative de la vidéoconférence
  * les autres clients sont participants
* Les listes de participants ne continnent jamais l'initiateur
* L'identifiant d'une vidéoconférence est unique et transmis dans chaque message

Structure d'un message type:
* message: La stance étend "message", à la manière des invitations MUC directes (XEP 0249) 
* message [from='full@jid/resource']
  * message videoconference [id='uniqueId']
  * message videoconference [status='initiate|abort|reinvite']
  * message videoconference [initiator='full@jid/resource']
  * message videoconference [users='full@jid/resource,full@jid/resource,...]
  * message videoconference [datetime='YYYY-MM-DD HH:MM:SS']
  * message videoconference [message='...']

## Initier une vidéoconférence

1. L'initiateur de la vidéoconférence sélectionne une liste d'identifiants Jabber complets
1. L'initiateur envoi à chacun des clients une invitation avec ces caractéristiques:
    * message videoconference [status='initiate']
 

_Exemple de message_: 
           
```
    <message from='remi@domain.xmpp/res'
             id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
             xmlns='jabber:client'
             to='david@domain.xmpp/511x45a6u2'>
    <videoconference users='david@domain.xmpp/res, david@domain.xmpp/res'
                     
                     status='initiate'
                     
                     id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
                     initiator='remi@domain.xmpp/res'
                     datetime='2012-06-22 05:40:06'
                     message='Remi vous invite à une vidéoconférence avec ...'/>
    </message>
```


**Séquence d'initation de vidéoconférence:**
* L'initiateur envoi une invitation à tous les participants
* Chaque participants peut:
  * Accepter la conférence, et envoyer un message d'acceptation à tous les participants
  * Ou décliner la conférence, et envoyer un message d'arrêt à tous les participants

## Réception d'une invitation

A la réception d'une invitation à une vidéoconférence:
 
1. Le client doit proposer une confirmation d'acceptation de participation à la vidéoconférence

**Si la vidéoconférence est approuvée**:

1. Le client doit stocker les adresses des participants pour accepter automatiquement les flux en entrée et forunir des flux en sortie
1. Le client doit envoyer un message de confirmation à tous les participants ainsi qu'à l'initiateur:
    
    * message videoconference [status='accepted']
    
1. Les autres clients doivent appeler l'emetteur de l'acceptation si il fait parti de la liste de sessions à initier.

 
**Si la vidéoconférence est refusée**:

1. Le client qui refuse doit envoyer une notification d'abandon de la vidéoconférence à chacun des autres participants et à l'initiateur avec les même caractéristiques que l'invitation sauf:

    * message [status='abort']: Indique l'action en cours, l'annulation d'une vidéoconférence

_Exemple de message_: 
                
```
    <message from='david@domain.xmpp/res'
             id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
             xmlns='jabber:client'
             to='yohann@domain.xmpp/res'>
    <videoconference users='david@domain.xmpp/res, david@domain.xmpp/res'
                     
                     status='abort'
                     
                     id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
                     initiator='remi@domain.xmpp/res'
                     datetime='2012-06-22 05:40:06'
                     message='David refuse la vidéo conférence'/>
    </message>
```

## Inviter à nouveau un client déconnecté

Si un client est déconnecté d'une vidéoconférence, il peut être invité à nouveau par n'importe quel autre participant.

Pour cela un client souhaitant inviter un utilisateur doit envoyer une notification à chacun des participants de la vidéoconférence.

```
    <message from='remi@domain.xmpp/res'
             id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
             xmlns='jabber:client'
             to='david@domain.xmpp/res'>
    <videoconference users='david@domain.xmpp/res, david@domain.xmpp/res'
                     
                     status='reinvite'
                     reinvite='yohann@domain.xmpp/res'
                     
                     id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
                     initiator='remi@domain.xmpp/res'
                     datetime='2012-06-22 05:40:06'
                     message=''/>
    </message>
```

A la réception de cette notification, le client 'cible' de la ré-invitation doit proposer une boite de dialogue de confirmation à l'utilisateur. Si la ré-invitation est acceptée le client doit envoyer une notification d'acceptation telle que décrite ci-dessus.
A réception de la notification d'acceptation, les clients ayant à initier une session avec le client cible devront couper leur appels et recommencer la séquence d'entrée en vidéo conférence, sans attentdre d'acceptation des différents participants. 

## Refus automatique de session multimédia

Si un client est indisponible pour une session multimédia il doit envoyer une notification à l'ensemble des participants et à l'initiateur:

```
    <message from='remi@domain.xmpp/res'
             id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
             xmlns='jabber:client'
             to='david@domain.xmpp/res'>
    <videoconference users='david@domain.xmpp/res, david@domain.xmpp/res'
                     
                     status='occupied'
                     
                     id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
                     initiator='remi@domain.xmpp/res'
                     datetime='2012-06-22 05:40:06'
                     message=''/>
    </message>
```

