/**
 * Etherpad integration
 * @type {{openpad: jsxc.etherpad.openpad}}
 */

jsxc.etherpad = {

  XMPP_INVITATIONS : {
    XMPP_ELEMENT_NAME : "etherpad", PADID_ATTR : "padid", ALL_USERS_ATTR : "allusers"
  },

  _init : function() {

    var self = jsxc.etherpad;

    self.conn = jsxc.xmpp.conn;

    self._messageHandler = self.conn.addHandler(jsxc.etherpad._onMessageReceived, null, 'message');
  },

  /**
   * Return true if Etherpad is enabled
   * @returns {boolean}
   */
  isEtherpadEnabled : function() {
    var opts = jsxc.options.get("etherpad");
    return opts.enabled === true;
  },

  /**
   * Return a link corresponding to an pad id
   * @param padId
   * @returns {string}
   */
  getEtherpadLinkFor : function(padId) {

    if (typeof padId === "undefined") {
      throw new Error("Invalid pad id: " + padId);
    }

    var opts = jsxc.options.get("etherpad");
    return opts.ressource + 'p/' + padId +
        '?showControls=true&showChat=false&showLineNumbers=true&useMonospaceFont=true';
  },

  /**
   * Return the code to embed to display pad
   * @param padId
   * @returns {string}
   * @private
   */
  _getEmbeddedCode : function(padId) {
    return '<iframe class="jsxc-etherpad-frame" name="embed_readwrite" src="' +
        jsxc.etherpad.getEtherpadLinkFor(padId) + '" style="width: 100%; height: 85%"></iframe>';
  },

  /**
   * Open a new pad in a window
   * @param bid
   */
  openpad : function(padId) {

    var self = jsxc.etherpad;
    var newgui = jsxc.newgui;

    jsxc.stats.addEvent('jsxc.etherpad.opened');

    if (self.isEtherpadEnabled() === false) {
      jsxc.warn('Etherpad not enabled');
      jsxc.gui.feedback("Etherpad n'est pas activé.");
      return;
    }

    jsxc.debug("Openning new pad", padId);

    var embedded = self._getEmbeddedCode(padId);
    newgui.addMediaRessource(embedded, 'Etherpad: ' + padId);

    if (newgui.isMediapanelShown() !== true) {
      newgui.toggleMediapanel();
    }

  },

  /**
   * Send invitations to join a pad. Not using a particular XEP for now.
   * @param padId
   * @param jidArray
   */
  sendInvitations : function(padId, jidArray) {

    jsxc.debug("Sending etherpad invitations", {padId : padId, jidArray : jidArray});

    var self = jsxc.etherpad;

    if (self.conn === null) {
      throw new Error("Disconnected");
    }

    if (!padId) {
      throw new Error("Invalid argument: " + padId);
    }

    if (!jidArray || !jidArray.length) {
      throw new Error("Invalid argument: " + jidArray);
    }

    var invitation = {};
    invitation[self.XMPP_INVITATIONS.PADID_ATTR] = padId;
    invitation[self.XMPP_INVITATIONS.ALL_USERS_ATTR] = jidArray.join(",");

    // XMPP message stanza
    var msg = $msg({
      from : self.conn.jid
    }).c(self.XMPP_INVITATIONS.XMPP_ELEMENT_NAME, invitation);

    var sent = [];

    // send to everybody
    $.each(jidArray, function(index, jid) {

      if (jid !== self.conn.jid) {
        var adressedMessage = $(msg.toString()).attr("to", jid);
        self.conn.send(adressedMessage);

        sent.push(jid);
      }

    });

  },

  /**
   * Check if we receive an etherpad invitation
   * @private
   */
  _onMessageReceived : function(stanza) {

    var self = jsxc.etherpad;

    // ignore eventual messages from current user
    if ($(stanza).attr("from") === self.conn.jid) {
      self._log("Ignoring message from current user: ", stanza, "ERROR");

      // keep handler
      return true;
    }

    // check if stanza is a videoconference invitation
    var etherpad = $(stanza).find(self.XMPP_INVITATIONS.XMPP_ELEMENT_NAME);

    if (etherpad.length > 0) {

      var from = $(stanza).attr("from");
      var node = Strophe.getNodeFromJid(from);
      var padId = etherpad.attr(self.XMPP_INVITATIONS.PADID_ATTR);

      jsxc.gui.showIncomingEtherpadDialog(node)
          .then(function() {
            jsxc.gui.feedback("Le document va être ouvert");
            self.openpad(padId);
          })

          .fail(function() {
            jsxc.gui.feedback("Document refusé");
            self._sendEtherpadRefusedMessage();
          });

    }

    // preserve handler
    return true;

  },

  _sendEtherpadRefusedMessage : function() {
    console.error("Refused");
    console.error("Refused");
    console.error("Refused");
    console.error("Refused");
    console.error("Refused");
    console.error("Refused");
    console.error("Refused");
    console.error("Refused");
    console.error("Refused");
  },

  _onDisconnected : function() {

    var self = jsxc.etherpad;

    self.conn.deleteHandler(self._messageHandler);

  }

};

$(function() {

  var self = jsxc.etherpad;

  $(document).on('attached.jsxc', self._init);
  $(document).on('disconnected.jsxc', self._onDisconnected);

});
