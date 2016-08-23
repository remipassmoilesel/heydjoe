/**
 * Handle functions related to the gui of the roster
 *
 * @namespace jsxc.gui.roster
 */
jsxc.gui.roster = {

  /** True if roster is initialised */
  ready : false,

  /** True if all items are loaded */
  loaded : false,

  /**
   * Init the roster skeleton
   *
   * @memberOf jsxc.gui.roster
   * @returns {undefined}
   */
  init : function() {
    
    // display or hide offline buddies
    if (jsxc.options.get('hideOffline')) {
      $('#jsxc_buddylist').addClass('jsxc_hideOffline');
    }

    // mute sounds
    if (jsxc.options.get('muteNotification')) {
      jsxc.notification.muteSound();
    }

    var pres = jsxc.storage.getUserItem('presence') || 'online';
    jsxc.xmpp.changeOwnPresence(pres);

    jsxc.notice.load();

    jsxc.gui.roster.ready = true;

    $(document).trigger('ready.roster.jsxc');

  },

  /**
   * Create roster item and add it to the roster
   *
   * @param {String} bid bar jid
   */
  add : function(bid) {

    var self = jsxc.gui.roster;

    var data = jsxc.storage.getUserItem('buddy', bid);

    if (!data) {
      throw new Error("Invalid buddy: " + bid);
    }

    var bud = jsxc.gui.buddyTemplate.clone().attr('data-bid', bid).attr('data-type',
        data.type || 'chat');

    // hide element if filter is enabled
    self.setVisibilityByFilter(bud);

    jsxc.gui.roster.insert(bid, bud);

    bud.click(function() {
      jsxc.gui.window.open(bid);
    });

    bud.find('.jsxc_msg').click(function() {
      jsxc.gui.window.open(bid);

      return false;
    });

    jsxc.gui.update(bid);

    var history = jsxc.storage.getUserItem('history', bid) || [];
    var i = 0;
    while (history.length > i) {
      var message = new jsxc.Message(history[i]);
      if (message.direction !== jsxc.Message.SYS) {
        $('[data-bid="' + bid + '"]').find('.jsxc_lastmsg .jsxc_text').html(
            jsxc.stripHtml(message.msg));
        break;
      }
      i++;
    }

    $(document).trigger('add.roster.jsxc', [bid, data, bud]);
  },

  availablesFilterModes : ['buddies', 'conversations'],

  filterMode : 'buddies', // buddies || conversations

  setFilterMode : function(mode) {

    var self = jsxc.gui.roster;

    if (self.availablesFilterModes.indexOf(mode) === -1) {
      throw new Error("Unknown mode: " + mode);
    }

    self.filterMode = mode;
  },

  setVisibilityByFilter : function(li) {

    var self = jsxc.gui.roster;

    var hideElement = function(element) {
      element.css("display", "none");
    };

    var showElement = function(element) {
      element.css({
        display : 'block'
      });
    };

    var type = li.data('type');
    if (type === 'chat') {

      if (self.filterMode === 'buddies') {
        showElement(li);
      }

      else {
        hideElement(li);
      }

    }

    // groupchat
    else if (type === "groupchat") {

      if (self.filterMode === 'buddies') {
        hideElement(li);
      }

      else {
        showElement(li);
      }

    }

    else {
      throw new Error("Unkown type: " + type);
    }
  },

  getItem : function(bid) {
    return $("#jsxc_buddylist > li[data-bid='" + bid + "']");
  },

  /**
   * Insert roster item. First order: online > away > offline. Second order:
   * alphabetical of the name
   *
   * @param {type} bid
   * @param {jquery} li roster item which should be insert
   * @returns {undefined}
   */
  insert : function(bid, li) {

    var data = jsxc.storage.getUserItem('buddy', bid);
    var listElements = $('#jsxc_buddylist > li');
    var insert = false;

    // Insert buddy with no mutual friendship to the end
    var status = (data.sub === 'both') ? data.status : -1;

    listElements.each(function() {

      var thisStatus = ($(this).data('sub') === 'both') ? $(this).data('status') : -1;

      if (($(this).data('name').toLowerCase() > data.name.toLowerCase() && thisStatus === status) ||
          thisStatus < status) {

        $(this).before(li);
        insert = true;

        return false;
      }
    });

    if (!insert) {
      li.appendTo('#jsxc_buddylist');
    }
  },

  /**
   * Initiate reorder of roster item
   *
   * @param {type} bid
   * @returns {undefined}
   */
  reorder : function(bid) {
    jsxc.gui.roster.insert(bid, jsxc.gui.roster.remove(bid));
  },

  /**
   * Removes buddy from roster
   *
   * @param {String} bid bar jid
   * @return {JQueryObject} Roster list element
   */
  remove : function(bid) {

    var res = jsxc.gui.roster.getItem(bid).detach();

    // It is a bad idea to trigger here. Remove is used in reorder, so events are too many
    // $(document).trigger('remove.roster.jsxc', [bid]);

    return res;
  },

  /**
   * Removes buddy from roster and clean up
   *
   * @param {String} bid bar compatible jid
   */
  purge : function(bid) {
    if (jsxc.master) {
      jsxc.storage.removeUserItem('buddy', bid);
      jsxc.storage.removeUserItem('otr', bid);
      jsxc.storage.removeUserItem('otr_version_' + bid);
      jsxc.storage.removeUserItem('chat', bid);
      jsxc.storage.removeUserItem('window', bid);
      jsxc.storage.removeUserElement('buddylist', bid);
      jsxc.storage.removeUserElement('windowlist', bid);
    }

    jsxc.gui.window._close(bid);
    jsxc.gui.roster.remove(bid);
  },

  /**
   * Create input element for rename action
   *
   * @param {type} bid
   * @returns {undefined}
   */
  rename : function(bid) {
    var name = jsxc.gui.roster.getItem(bid).find('.jsxc_name');
    var options = jsxc.gui.roster.getItem(bid).find('.jsxc_lastmsg, .jsxc_more');
    var input = $('<input type="text" name="name"/>');

    // hide more menu
    $('body').click();

    options.hide();
    name = name.replaceWith(input);

    input.val(name.text());
    input.keypress(function(ev) {
      if (ev.which !== 13) {
        return;
      }

      options.css('display', '');
      input.replaceWith(name);
      jsxc.gui.roster._rename(bid, $(this).val());

      $('html').off('click');
    });

    // Disable html click event, if click on input
    input.click(function() {
      return false;
    });

    $('html').one('click', function() {
      options.css('display', '');
      input.replaceWith(name);
      jsxc.gui.roster._rename(bid, input.val());
    });
  },

  /**
   * Rename buddy
   *
   * @param {type} bid
   * @param {type} newname new name of buddy
   * @returns {undefined}
   */
  _rename : function(bid, newname) {
    if (jsxc.master) {
      var d = jsxc.storage.getUserItem('buddy', bid) || {};

      if (d.type === 'chat') {
        var iq = $iq({
          type : 'set'
        }).c('query', {
          xmlns : 'jabber:iq:roster'
        }).c('item', {
          jid : Strophe.getBareJidFromJid(d.jid), name : newname
        });
        jsxc.xmpp.conn.sendIQ(iq);
      } else if (d.type === 'groupchat') {
        jsxc.xmpp.bookmarks.add(bid, newname, d.nickname, d.autojoin);
      }
    }

    jsxc.storage.updateUserItem('buddy', bid, 'name', newname);
    jsxc.gui.update(bid);
  },

  /**
   * Shows a text with link to a login box that no connection exists.
   */
  noConnection : function() {

    $('#jsxc_buddylist').empty();

    $('#jsxc_buddylist').find(".jsxc_rosterIsEmptyMessage").remove();

    var reconnectMsg = $("<div class='jsxc-reconnect-message'>Vous êtes déconnecté</div>");
    reconnectMsg.click(function() {
      jsxc.api.reconnect();
    });

    $('#jsxc_buddylist').append(reconnectMsg);

    $(document).one('attached.jsxc', function() {
      $('#jsxc_buddylist').find(".jsxc-reconnect-message").remove();
    });

  },

  /**
   * Shows a text with link to add a new buddy.
   *
   * @memberOf jsxc.gui.roster
   */
  empty : function() {

    var text = $(
        '<p class="jsxc_rosterIsEmptyMessage">Votre liste est vide, invitez de nouveaux contacts !</p>');

    text.click(function() {
      jsxc.newgui.toggleSearchPanel();
    });

    var buddyList = $('#jsxc_buddylist');

    if (buddyList.find(".jsxc_rosterIsEmptyMessage").length < 1) {
      buddyList.prepend(text);

      $(document).one('add.roster.jsxc', function() {
        $('#jsxc_buddylist').find(".jsxc_rosterIsEmptyMessage").remove();
      });
    }

  }
};