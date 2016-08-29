
* Erreur 503 sur un serveur XMPP: fournir le full jid avec la ressource


        user@domain
        user@domain/resource
        
        // Si l'erreur persiste: s'assurer d'envoyer une première présence à la connexion
        conn.send($pres())

* Adapter.js: activer le log
   
    
    adapter.disableLog(false);

* Récupérer un media avec adapter.js (1.4)

    
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
            console.log(arguments);
          }).catch(function() {
            console.log(arguments);
          });

* Récupération d'un flux sans utilisation d'Adapter:


    navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    var constraints = {
      audio: true,
      video: true
    };

    navigator.getUserMedia(constraints, successCallback, errorCallback);

* En cas d'erreur de ce type: 
    
    
    navigator.getUserMedia error:
    NavigatorUserMediaError {code: 1, PERMISSION_DENIED: 1}
    
    // Les contraintes passées à getUserMedia() sont incorrectes. 
    // Voir http://www.html5rocks.com/fr/tutorials/webrtc/basics/#toc-mediastream 