# Evenements JSXC

* attached.jsxc (): déclenché à la connexion XMPP. Bon moment pour initialiser des modules XMPP
* cloaded.roster.jsxc (): roster chargé





restoreCompleted.jsxc ()

notificationfailure.jsxc ()

ready.roster.jsxc ()

add.roster.jsxc ({String} bid, {Object} buddy data, {jQuery} roster item)

toggle.roster.jsxc ({"show"|"hidden"} state,  {Number} duration)

complete.dialog.jsxc ()

close.dialog.jsxc ()

cleanup.dialog.jsxc ()

init.window.jsxc ({jQuery} window)

show.window.jsxc ()

hidden.window.jsxc ()

postmessagein.jsxc ({String} bid,  {String} html)

connected.jsxc ()

attached.jsxc ()

disconnected.jsxc ()

connectionReady.jsxc ()

presence.jsxc ({String} from, {Integer} buddy state, {XML} presence stanza)

message.jsxc ({String} from, {String} body)

loaded.vcard.jsxc ({Object} data)

notificationready.jsxc ()

jsxc.lib.webrtc.js

finish.mediaready.jsxc ()

accept.call.jsxc ()

reject.call.jsxc ()

callterminated.jingle ()

mediaready.jingle ({Object} local stream)