# Intégration pour la plateforme Silverpeas

## Identification des utilisateurs

Les utilisateurs sont identifiés par leur identifiant numérique Silverpeas, sous la forme d'une chaine de caractère.
L'API est présente partout où les outils Silverpeas principaux sont disponibles.

## API à utiliser sur l'interface de la plateforme

        /**  
            Ouvrir une conversation de 'chat' avec un destinataire
        */
        SilverpeasChat.openChatWindow(userId)

        /**
            Inviter une personne dans une conversation en cours
        */
        SilverpeasChat.inviteUserInConversation(userId)
        
        /**
            Ouvrir une conversation entre plusieurs destinataires, avec invitations.
            Une conversation entre plusieurs destinataires n'est pas exactement du même type
            que les conversations de 'chat'. 
        */
        SilverpeasChat.startNewConversation(userId1, userId2, userId3, ...)
        
        /**
            Commencer une vidéoconférence avec un ou plusieurs destinataires.
        */
        SilverpeasChat.startNewVideoconference(userId1, userId2, userId3, ...)
        
        /**
            Commencer une session de partage d'écran. Une session de partage de conversation
            et initiée par un utilisateur mais peut être reçue de plusieurs utilisateurs.
        */
        SilverpeasChat.startScreenSharing(userId1, userId2, userId3, ...)
        
        
