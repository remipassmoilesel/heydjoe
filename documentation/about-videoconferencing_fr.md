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
 
Ce qui donne pour notre exemple la séquence suivante:
 
1. b@domain/res, l'initiateur, devra contacter `c`, `d` et `a`
1. c@domain/res devra contacter `d` et `a`
1. d@domain/res devra contacter `a`
1. a@domain/res ne devra contacter personne

## Initier une vidéoconférence

1. L'initiateur de la vidéoconférence sélectionne une liste d'identifiants Jabber complets
1. L'initiateur envoi à chacun des clients une invitation avec ces caractéristiques:

    * message: La stance étend "message", à la manière des invitations MUC directes (XEP 0249) 
    * message [from='full@jid/resource']: JID complet du client qui initie la conférence
    * message [status='initiate']: Indique l'action en cours, le démarrage d'une vidéoconférence
    * message videoconference [users='full@jid/resource,full@jid/resource,...]: la liste des identifiants complets des clients, séparés par une virgule
    * message videoconference [datetime='YYYY-MM-DD HH:MM:SS']: la date de la conférence
    * message videoconference [message='...']: Un message optionnel 

_Exemple de message_: 
           
```
    <message from='remi@im.silverpeas.net/4kr2qyth2y'
             id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
             xmlns='jabber:client'
             to='david@im.silverpeas.net/511x45a6u2'>
    <videoconference users='david@im.silverpeas.net/511x45a6u2'
                     status='initiate'
                     datetime='2012-06-22 05:40:06'
                     message=''/>
    </message>
```

## Réception d'une invitation

A la réception d'une invitation à une vidéoconférence:

1. Le client doit stocker la liste des participants pour mettre éventuellement en attente les flux d'autres participants. En effet, d'autres participants sont susceptibles d'avoir accepté la conférence auparavant. 
1. Le client doit proposer une confirmation d'acceptation de participation

**Si la vidéoconférence est approuvée**:

1. Le client doit accepter tous les flux en attente
1. Le client doit stocker les adresses des participants encore non approuvés pour accepter automatiquement les flux
 
**Si la vidéoconférence est refusée**:

1. Le client qui refuse doit envoyer une notification d'abandon de la vidéoconférence à chacun des autres participants avec les même caractéristique que l'invitation sauf:

    * message [status='abort']: Indique l'action en cours, l'annulation d'une vidéoconférence
    * message [id='.....']: L'identifiant unique de la vidéo conférence

_Exemple de message_: 
                
```
    <message xmlns='jabber:client'
             from='david@im.silverpeas.net/511x45a6u2'
             to='remi@im.silverpeas.net/4kr2qyth2y'>
    <videoconference users='david@im.silverpeas.net/511x45a6u2,remi@im.silverpeas.net/4kr2qyth2y'
                     status='abort'
                     id='579f7d5a-a70d-4ed8-a660-7f2f3d2e2696'
                     datetime='2012-06-22 05:40:06'
                     message='Vidéoconférence annulée par david'/>
    </message>
```    

    
   

        
