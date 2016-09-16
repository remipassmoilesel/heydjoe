/**
 * Etherpad integration
 * @type {{openpad: jsxc.etherpad.openpad}}
 */

jsxc.etherpad = {

  XMPP_INVITATIONS : {

    XMPP_ELEMENT_NAME : "etherpad",

    PADID_ATTR : "padid",

    ALL_USERS_ATTR : "allusers",

    INVITATIONID_ATTR : "id",

    STATUS_ATTR : "status",

    STATUS_INVITATION : "invitation",

    STATUS_REFUSED : "refused"

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

    jsxc.stats.addEvent('jsxc.etherpad.openpad');

    if (self.isEtherpadEnabled() === false) {
      jsxc.warn('Etherpad not enabled');
      jsxc.gui.feedback("Etherpad n'est pas activé.");
      return;
    }

    jsxc.debug("Openning new pad", padId);

    // get etherpad iframe
    var embedded = self._getEmbeddedCode(padId);

    // add link below
    var link = '<a href="' + self.getEtherpadLinkFor(padId) + '" target="_blank"' +
        ' class="jsxc-etherpad-new-window-link">Ouvrir dans une nouvelle fenêtre...</a>';

    newgui.addMediaRessource(embedded + link, 'Etherpad: ' + padId);

    // toggle media panel if necessary
    newgui.toggleMediapanel(true);

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
    invitation[self.XMPP_INVITATIONS.STATUS_ATTR] = self.XMPP_INVITATIONS.STATUS_INVITATION;
    invitation[self.XMPP_INVITATIONS.INVITATIONID_ATTR] = self.conn.getUniqueId();

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

    jsxc.stats.addEvent('jsxc.etherpad.invitationsSent');

  },

  /**
   * Send an XMPP message notifying that document is refused by user.
   * @private
   */
  _sendEtherpadRefusedMessage : function(to, padId, invitationId) {

    jsxc.debug("Sending etherpad refused message", {invitationId : invitationId});

    var self = jsxc.etherpad;

    if (!to) {
      throw new Error("Invalid argument: " + padId);
    }
    if (!padId) {
      throw new Error("Invalid argument: " + padId);
    }
    if (!invitationId) {
      throw new Error("Invalid argument: " + invitationId);
    }

    var message = {};
    message[self.XMPP_INVITATIONS.PADID_ATTR] = padId;
    message[self.XMPP_INVITATIONS.STATUS_ATTR] = self.XMPP_INVITATIONS.STATUS_REFUSED;
    message[self.XMPP_INVITATIONS.INVITATIONID_ATTR] = invitationId;

    // XMPP message stanza
    var msg = $msg({
      from : self.conn.jid, to : to
    }).c(self.XMPP_INVITATIONS.XMPP_ELEMENT_NAME, message);

    // send message
    self.conn.send(msg);

  },

  /**
   * Check if we receive an etherpad invitation
   * @private
   */
  _onMessageReceived : function(stanza) {

    var self = jsxc.etherpad;

    // ignore eventual messages from current user
    if ($(stanza).attr("from") === self.conn.jid) {
      //self._log("Ignoring message from current user: ", stanza, "ERROR");

      // keep handler
      return true;
    }

    // check if stanza is a videoconference invitation
    var etherpad = $(stanza).find(self.XMPP_INVITATIONS.XMPP_ELEMENT_NAME);

    if (etherpad.length > 0) {

      var from = $(stanza).attr("from");
      var node = Strophe.getNodeFromJid(from);
      var padId = etherpad.attr(self.XMPP_INVITATIONS.PADID_ATTR);
      var invitationId = etherpad.attr(self.XMPP_INVITATIONS.INVITATIONID_ATTR);

      var status = (etherpad.attr('status') || '').trim();

      // we have been just invited
      if (self.XMPP_INVITATIONS.STATUS_INVITATION === status) {

        jsxc.notice.add(node + " vous invite à partager un document Etherpad", "",
            'gui.showIncomingEtherpadDialog', [from, padId, invitationId]);

      }

      // someone refused a pad
      else if (self.XMPP_INVITATIONS.STATUS_REFUSED === status) {
        jsxc.gui.feedback("<b>" + node + "</b> a refusé le document");
      }

    }

    // preserve handler
    return true;

  },

  /**
   * Called when we are disconnected from XMPP server.
   *
   * Allows to remove handlers
   *
   * @private
   */
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
