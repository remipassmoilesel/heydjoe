/**
 * Handle functions related to the gui of the window
 *
 * @namespace jsxc.gui.window
 */
jsxc.gui.window = {

  /**
   * Interval between composing chat state sends
   */
  sendComposingIntervalMs : 900,

  /**
   *
   */
  hideComposingNotifDelay : 3000,

  /**
   * Show a composing presence from jid specified in argument. JID can be a room jid or a person jid
   * @param from
   */
  showComposingPresence : function(from, type) {

    var bid = Strophe.getBareJidFromJid(from);
    var user = type === "chat" ? Strophe.getNodeFromJid(from) : Strophe.getResourceFromJid(from);

    // iterate window list
    $('#jsxc_windowList .jsxc_windowItem').each(function() {

      // the window element, where are stored informations
      var self = $(this);

      var winBid = self.data("bid");

      // check conversation
      if (winBid === bid) {

        // add user in array if necessary
        var usersComposing = self.data("usersComposing") || [];
        if (usersComposing.indexOf(user) === -1) {
          usersComposing.push(user);
          self.data("usersComposing", usersComposing);
        }

        var textarea = self.find(".jsxc_textarea");
        var composingNotif = textarea.find(".jsxc_userComposing");

        // add notification if necessary
        if (composingNotif.length < 1) {
          textarea.append("<div class='jsxc_userComposing jsxc_chatmessage jsxc_sys'></div>");
          composingNotif = textarea.find(".jsxc_userComposing");
        }

        // change text
        var msg = usersComposing.length > 1 ? " sont en train d'écrire ..." :
            " est en train d'écrire ...";
        composingNotif.html(usersComposing.join(", ") + msg);

        // scroll to bottom
        jsxc.gui.window.scrollDown(winBid);

        // hide notification after delay
        if ($(this).data("composingTimeout")) {
          clearTimeout($(this).data("composingTimeout"));
        }

        $(this).data("composingTimeout",

            setTimeout(function() {

              textarea.find(".jsxc_userComposing").remove();

              // empty user list
              self.data("usersComposing", []);

            }, jsxc.gui.window.hideComposingNotifDelay));

        // show only one presence
        return false;
      }

    });
  },

  /**
   * Init a window skeleton
   *
   * @memberOf jsxc.gui.window
   * @param {String} bid
   * @returns {jQuery} Window object
   */
  init : function(bid) {

    if (jsxc.gui.window.get(bid).length > 0) {
      return jsxc.gui.window.get(bid);
    }

    var win = jsxc.gui.windowTemplate.clone().attr('data-bid', bid).appendTo(
        '#jsxc_windowList > ul');
    var data = jsxc.storage.getUserItem('buddy', bid);

    // Attach jid to window
    win.data('jid', data.jid);

    // Add handler

    // @TODO generalize this. Duplicate of jsxc.roster.add
    var expandClick = function() {
      win.trigger('extra.jsxc');

      $('body').click();

      if (!win.find('.jsxc_menu').hasClass('jsxc_open')) {
        win.find('.jsxc_menu').addClass('jsxc_open');

        $('body').one('click', function() {
          win.find('.jsxc_menu').removeClass('jsxc_open');
        });
      }

      return false;
    };

    win.find('.jsxc_more').click(expandClick);

    // open a pad
    win.find(".jsxc_openpad").click(function() {

      var padId = bid.substr(0, 26).replace(/[^a-z0-9]+/gi, "") + "_" +
          jsxc.sha1.hash(bid).substr(0, 22);

      padId = padId.toLocaleLowerCase();

      jsxc.etherpad.openpad(padId);
    });

    win.find('.jsxc_verification').click(function() {
      jsxc.gui.showVerification(bid);
    });

    win.find('.jsxc_fingerprints').click(function() {
      jsxc.gui.showFingerprints(bid);
    });

    win.find('.jsxc_transfer').click(function() {
      jsxc.otr.toggleTransfer(bid);
    });

    win.find('.jsxc_bar').click(function() {
      jsxc.gui.window.toggle(bid);
    });

    win.find('.jsxc_close').click(function() {
      jsxc.gui.window.close(bid);
    });

    win.find('.jsxc_clear').click(function() {
      jsxc.gui.window.clear(bid);
    });

    win.find('.jsxc_sendFile').click(function() {
      $('body').click();

      jsxc.gui.window.sendFile(bid);
    });

    win.find('.jsxc_tools').click(function() {
      return false;
    });

    // last composing state sent time is stored here
    win.data('lastComposingStateSent', -1);

    win.find('.jsxc_textinput').keyup(function(ev) {
      var body = $(this).val();

      if (ev.which === 13) {
        body = '';
      }

      jsxc.storage.updateUserItem('window', bid, 'text', body);

      if (ev.which === 27) {
        jsxc.gui.window.close(bid);
      }

      // send composing presence
      if (jsxc.xmpp.conn) {

        var now = new Date().getTime();
        var last = win.data('lastComposingStateSent');

        // send only every 'n' ms interval
        if (last === "-1" || (now - last) > jsxc.gui.window.sendComposingIntervalMs) {

          var type = win.hasClass('jsxc_groupchat') ? 'groupchat' : 'chat';

          jsxc.xmpp.conn.chatstates.sendComposing(bid, type);

          win.data('lastComposingStateSent', now);
        }

      }

    }).keypress(function(ev) {
      if (ev.which !== 13 || !$(this).val()) {
        return;
      }

      jsxc.gui.window.postMessage({
        bid : bid, direction : jsxc.Message.OUT, msg : $(this).val()
      });

      $(this).val('');
    }).focus(function() {
      // remove unread flag
      jsxc.gui.readMsg(bid);
    }).mouseenter(function() {
      $('#jsxc_windowList').data('isOver', true);
    }).mouseleave(function() {
      $('#jsxc_windowList').data('isOver', false);
    });

    win.find('.jsxc_textarea').click(function() {
      // check if user clicks element or selects text
      if (typeof getSelection === 'function' && !getSelection().toString()) {
        win.find('.jsxc_textinput').focus();
      }
    });

    win.find('.jsxc_textarea').slimScroll({
      height : '234px', distance : '3px'
    });

    win.find('.jsxc_name').disableSelection();

    win.find('.slimScrollDiv').resizable({
      handles : 'w, nw, n', minHeight : 234, minWidth : 250, resize : function(event, ui) {
        jsxc.gui.window.resize(win, ui);
      }, start : function() {
        win.removeClass('jsxc_normal');
      }, stop : function() {
        win.addClass('jsxc_normal');
      }
    });

    win.find('.jsxc_window').css('bottom', -1 * win.find('.jsxc_fade').height());

    if ($.inArray(bid, jsxc.storage.getUserItem('windowlist')) < 0) {

      // add window to windowlist
      var wl = jsxc.storage.getUserItem('windowlist') || [];
      wl.push(bid);
      jsxc.storage.setUserItem('windowlist', wl);

      // init window element in storage
      jsxc.storage.setUserItem('window', bid, {
        minimize : true, text : '', unread : 0
      });

      jsxc.gui.window.hide(bid);
    } else {

      if (jsxc.storage.getUserItem('window', bid).unread) {
        jsxc.gui._unreadMsg(bid);
      }
    }

    $.each(jsxc.gui.emotions, function(i, val) {
      var ins = val[0].split(' ')[0];
      var li = $('<li>');
      li.append(jsxc.gui.shortnameToImage(':' + val[1] + ':'));
      li.find('div').attr('title', ins);
      li.click(function() {
        win.find('input').val(win.find('input').val() + ins);
        win.find('input').focus();
      });
      win.find('.jsxc_emoticons ul').prepend(li);
    });

    jsxc.gui.toggleList.call(win.find('.jsxc_emoticons'));

    jsxc.gui.window.restoreChat(bid);

    jsxc.gui.update(bid);

    jsxc.gui.updateWindowListSB();

    // create related otr object
    if (jsxc.master && !jsxc.otr.objects[bid]) {
      jsxc.otr.create(bid);
    } else {
      jsxc.otr.enable(bid);
    }

    // display warning if buddy is offline or none suscribed
    var node = Strophe.getNodeFromJid(win.data('jid'));
    if (win.data('status') === 'offline') {
      win.find('.jsxc_textarea').append(
          "<div class='jsxc-warning-offline'><i>" + node + "</i> est à présent déconnecté</div>");

      win.find(".jsxc_textinput").keyup(function(){
        if(win.data('status') !== 'offline'){
          win.find(".jsxc-warning-offline").remove();
        }
      });
    }

    if (data.sub !== "both") {
      win.find('.jsxc_textarea').append("<div class='jsxc-warning-notbuddy'><i>" + node +
          "</i> n'est pas dans vos contacts. Votre interlocuteur peut refuser " +
          "de voir vos messages.</div>");

      win.find(".jsxc_textinput").keyup(function(){
        if(win.data('status') !== 'offline'){
          // TODO: to improve
          win.find(".jsxc-warning-notbuddy").remove();
        }
      });
    }

    $(document).trigger('init.window.jsxc', [win]);

    return win;
  },

  /**
   * Resize given window to given size. If no size is provided the window is resized to the default
   * size.
   *
   * @param  {(string|jquery)} win Bid or window object
   * @param  {object} ui    The size has to be in the format {size:{width: [INT], height: [INT]}}
   * @param  {boolean} [outer] If true the given size is used as outer dimensions.
   */
  resize : function(win, ui, outer) {
    var bid;

    if (typeof win === 'object') {
      bid = win.attr('data-bid');
    } else if (typeof win === 'string') {
      bid = win;
      win = jsxc.gui.window.get(bid);
    } else {
      jsxc.warn('jsxc.gui.window.resize has to be called either with bid or window object.');
      return;
    }

    if (!win.attr('data-default-height')) {
      win.attr('data-default-height', win.find('.ui-resizable').height());
    }

    if (!win.attr('data-default-width')) {
      win.attr('data-default-width', win.find('.ui-resizable').width());
    }

    var outer_height_diff = (outer) ?
    win.find('.jsxc_window').outerHeight() - win.find('.ui-resizable').height() : 0;

    ui = $.extend({
      size : {
        width : parseInt(win.attr('data-default-width')),
        height : parseInt(win.attr('data-default-height')) + outer_height_diff
      }
    }, ui || {});

    if (outer) {
      ui.size.height -= outer_height_diff;
    }

    win.find('.slimScrollDiv').css({
      width : ui.size.width, height : ui.size.height
    });

    win.width(ui.size.width);

    win.find('.jsxc_textarea').slimScroll({
      height : ui.size.height
    });

    // var offset = win.find('.slimScrollDiv').position().top;
    //win.find('.jsxc_emoticons').css('top', (ui.size.height + offset + 6) + 'px');

    $(document).trigger('resize.window.jsxc', [win, bid, ui.size]);
  },

  fullsize : function(bid) {
    var win = jsxc.gui.window.get(bid);
    var size = jsxc.options.viewport.getSize();

    size.width -= 10;
    size.height -= win.find('.jsxc_bar').outerHeight() + win.find('.jsxc_textinput').outerHeight();

    jsxc.gui.window.resize(win, {
      size : size
    });
  },

  /**
   * Returns the window element
   *
   * @param {String} bid
   * @returns {jquery} jQuery object of the window element
   */
  get : function(id) {
    return $("li.jsxc_windowItem[data-bid='" + jsxc.jidToBid(id) + "']");
  },

  /**
   * Open a window, related to the bid. If the window doesn't exist, it will be
   * created.
   *
   * @param {String} bid
   * @returns {jQuery} Window object
   */
  open : function(bid) {

    var win = jsxc.gui.window.init(bid);

    jsxc.gui.window.show(bid);
    jsxc.gui.window.highlight(bid);

    return win;
  },

  /**
   * Close chatwindow and clean up
   *
   * @param {String} bid bar jid
   */
  close : function(bid) {

    if (jsxc.gui.window.get(bid).length === 0) {
      jsxc.warn('Want to close a window, that is not open.');
      return;
    }

    jsxc.storage.removeUserElement('windowlist', bid);
    jsxc.storage.removeUserItem('window', bid);

    if (jsxc.storage.getUserItem('buddylist').indexOf(bid) < 0) {
      // delete data from unknown sender

      jsxc.storage.removeUserItem('buddy', bid);
      jsxc.storage.removeUserItem('chat', bid);
    }

    jsxc.gui.window._close(bid);
  },

  /**
   * Close chatwindow
   *
   * @param {String} bid
   */
  _close : function(bid) {
    jsxc.gui.window.get(bid).remove();
    jsxc.gui.updateWindowListSB();
  },

  /**
   * Toggle between minimize and maximize of the text area
   *
   * @param {String} bid bar jid
   */
  toggle : function(bid) {

    var win = jsxc.gui.window.get(bid);

    if (win.parents("#jsxc_windowList").length === 0) {
      return;
    }

    if (win.hasClass('jsxc_min')) {
      jsxc.gui.window.show(bid);
    } else {
      jsxc.gui.window.hide(bid);
    }

    jsxc.gui.updateWindowListSB();
  },

  /**
   * Maximize text area and save
   *
   * @param {String} bid
   */
  show : function(bid) {

    jsxc.storage.updateUserItem('window', bid, 'minimize', false);

    return jsxc.gui.window._show(bid);
  },

  /**
   * Maximize text area
   *
   * @param {String} bid
   * @returns {undefined}
   */
  _show : function(bid) {
    var win = jsxc.gui.window.get(bid);
    var duration = 0;

    if (jsxc.isExtraSmallDevice()) {
      if (parseFloat($('#jsxc_roster').css('right')) >= 0) {
        duration = jsxc.gui.roster.toggle();
      }

      jsxc.gui.window.hide();
      jsxc.gui.window.fullsize(bid);
    }

    win.removeClass('jsxc_min').addClass('jsxc_normal');
    win.find('.jsxc_window').css('bottom', '0');

    setTimeout(function() {
      var padding = $("#jsxc_windowListSB").width();
      var innerWidth = $('#jsxc_windowList>ul').width();
      var outerWidth = $('#jsxc_windowList').width() - padding;

      if (innerWidth > outerWidth) {
        var offset = parseInt($('#jsxc_windowList>ul').css('right'));
        var width = win.outerWidth(true);

        var right = innerWidth - win.position().left - width + offset;
        var left = outerWidth - (innerWidth - win.position().left) - offset;

        if (left < 0) {
          jsxc.gui.scrollWindowListBy(left * -1);
        }

        if (right < 0) {
          jsxc.gui.scrollWindowListBy(right);
        }
      }
    }, duration);

    // If the area is hidden, the scrolldown function doesn't work. So we
    // call it here.
    jsxc.gui.window.scrollDown(bid);

    if (jsxc.restoreCompleted) {
      win.find('.jsxc_textinput').focus();
    }

    win.trigger('show.window.jsxc');
  },

  /**
   * Minimize text area and save
   *
   * @param {String} [bid]
   */
  hide : function(bid) {
    var hide = function(bid) {
      jsxc.storage.updateUserItem('window', bid, 'minimize', true);

      jsxc.gui.window._hide(bid);
    };

    if (bid) {
      hide(bid);
    } else {
      $('#jsxc_windowList > ul > li').each(function() {
        var el = $(this);

        if (!el.hasClass('jsxc_min')) {
          hide(el.attr('data-bid'));
        }
      });
    }
  },

  /**
   * Minimize text area
   *
   * @param {String} bid
   */
  _hide : function(bid) {
    var win = jsxc.gui.window.get(bid);

    win.removeClass('jsxc_normal').addClass('jsxc_min');
    win.find('.jsxc_window').css('bottom', -1 * win.find('.jsxc_fade').height());

    win.trigger('hidden.window.jsxc');
  },

  /**
   * Highlight window
   *
   * @param {type} bid
   */
  highlight : function(bid) {
    var el = jsxc.gui.window.get(bid).find(' .jsxc_bar');

    if (!el.is(':animated')) {
      el.effect('highlight', {
        color : 'orange'
      }, 2000);
    }
  },

  /**
   * Scroll chat area to the bottom
   *
   * @param {String} bid bar jid
   */
  scrollDown : function(bid) {
    var chat = jsxc.gui.window.get(bid).find('.jsxc_textarea');

    // check if chat exist
    if (chat.length === 0) {
      return;
    }

    chat.slimScroll({
      scrollTo : (chat.get(0).scrollHeight + 'px')
    });
  },

  /**
   * Write Message to chat area and save. Check border cases and remove html.
   *
   * @function postMessage
   * @memberOf jsxc.gui.window
   * @param {jsxc.Message} message object to be send
   * @return {jsxc.Message} maybe modified message object
   */
  /**
   * Create message object from given properties, write Message to chat area
   * and save. Check border cases and remove html.
   *
   * @function postMessage
   * @memberOf jsxc.gui.window
   * @param {object} args New message properties
   * @param {string} args.bid
   * @param {direction} args.direction
   * @param {string} args.msg
   * @param {boolean} args.encrypted
   * @param {boolean} args.forwarded
   * @param {boolean} args.sender
   * @param {integer} args.stamp
   * @param {object} args.attachment Attached data
   * @param {string} args.attachment.name File name
   * @param {string} args.attachment.size File size
   * @param {string} args.attachment.type File type
   * @param {string} args.attachment.data File data
   * @return {jsxc.Message} maybe modified message object
   */
  postMessage : function(message) {

    if (typeof message === 'object' && !(message instanceof jsxc.Message)) {
      message = new jsxc.Message(message);
    }

    var data = jsxc.storage.getUserItem('buddy', message.bid);
    var html_msg = message.msg;

    // remove html tags and reencode html tags
    message.msg = jsxc.removeHTML(message.msg);
    message.msg = jsxc.escapeHTML(message.msg);

    // exceptions:

    if (message.direction === jsxc.Message.OUT && data.msgstate === OTR.CONST.MSGSTATE_FINISHED &&
        message.forwarded !== true) {
      message.direction = jsxc.Message.SYS;
      message.msg = jsxc.t('your_message_wasnt_send_please_end_your_private_conversation');
    }

    if (message.direction === jsxc.Message.OUT && data.msgstate === OTR.CONST.MSGSTATE_FINISHED) {
      message.direction = 'sys';
      message.msg = jsxc.t('unencrypted_message_received') + ' ' + message.msg;
    }

    message.encrypted = message.encrypted || data.msgstate === OTR.CONST.MSGSTATE_ENCRYPTED;

    try {
      message.save();
    } catch (err) {
      jsxc.warn('Unable to save message.', err);

      message = new jsxc.Message({
        msg : 'Unable to save that message. Please clear some chat histories.',
        direction : jsxc.Message.SYS
      });
    }

    if (message.direction === 'in' &&
        !jsxc.gui.window.get(message.bid).find('.jsxc_textinput').is(":focus")) {
      jsxc.gui.unreadMsg(message.bid);

      $(document).trigger('postmessagein.jsxc', [message.bid, html_msg]);
    }

    if (message.direction === jsxc.Message.OUT && jsxc.master && message.forwarded !== true &&
        html_msg) {
      jsxc.xmpp.sendMessage(message.bid, html_msg, message._uid);
    }

    jsxc.gui.window._postMessage(message);

    if (message.direction === 'out' && message.msg === '?' &&
        jsxc.options.get('theAnswerToAnything') !== false) {
      if (typeof jsxc.options.get('theAnswerToAnything') === 'undefined' ||
          (Math.random() * 100 % 42) < 1) {
        jsxc.options.set('theAnswerToAnything', true);

        jsxc.gui.window.postMessage(new jsxc.Message({
          bid : message.bid, direction : jsxc.Message.SYS, msg : '42'
        }));
      }
    }

    return message;
  },

  /**
   * Write Message to chat area
   *
   * @param {String} bid bar jid
   * @param {Object} post Post object with direction, msg, uid, received
   * @param {Bool} restore If true no highlights are used
   */
  _postMessage : function(message, restore) {
    var bid = message.bid;
    var win = jsxc.gui.window.get(bid);
    var msg = message.msg;
    var direction = message.direction;
    var uid = message._uid;

    // remove user composing notifications
    win.find(".jsxc_userComposing").remove();

    if (win.find('.jsxc_textinput').is(':not(:focus)') && direction === jsxc.Message.IN &&
        !restore) {
      jsxc.gui.window.highlight(bid);
    }

    // msg = msg.replace(jsxc.CONST.REGEX.URL, function(url) {
    //
    //   var href = (url.match(/^https?:\/\//i)) ? url : 'http://' + url;
    //
    //   // @TODO use jquery element builder
    //   return '<a href="' + href + '" target="_blank">' + url + '</a>';
    // });

    // search ressources and replace urls
    msg = jsxc.ressources.enlightenRessourcesInText(msg);

    // msg = msg.replace(
    //     new RegExp('(xmpp:)?(' + jsxc.CONST.REGEX.JID.source + ')(\\?[^\\s]+\\b)?', 'i'),
    //     function(match, protocol, jid, action) {
    //       if (protocol === 'xmpp:') {
    //         if (typeof action === 'string') {
    //           jid += action;
    //         }
    //
    //         // @TODO use jquery element builder
    //         return '<a href="xmpp:' + jid + '">xmpp:' + jid + '</a>';
    //       }
    //
    //       // @TODO use jquery element builder
    //       return '<a href="mailto:' + jid + '" target="_blank">mailto:' + jid + '</a>';
    //     });

    // replace emoticons from XEP-0038 and pidgin with shortnames
    $.each(jsxc.gui.emotions, function(i, val) {
      msg = msg.replace(val[2], ':' + val[1] + ':');
    });

    // translate shortnames to images
    msg = jsxc.gui.shortnameToImage(msg);

    // replace line breaks
    msg = msg.replace(/(\r\n|\r|\n)/g, '<br />');

    var msgDiv = $("<div>"), msgTsDiv = $("<div>");
    msgDiv.addClass('jsxc_chatmessage jsxc_' + direction);
    msgDiv.attr('id', uid.replace(/:/g, '-'));
    msgDiv.html('<div>' + msg + '</div>');
    msgTsDiv.addClass('jsxc_timestamp');
    msgTsDiv.text(jsxc.getFormattedTime(message.stamp));

    if (message.isReceived() || false) {
      msgDiv.addClass('jsxc_received');
    }

    if (message.forwarded) {
      msgDiv.addClass('jsxc_forwarded');
    }

    if (message.encrypted) {
      msgDiv.addClass('jsxc_encrypted');
    }

    if (message.attachment && message.attachment.name) {
      var attachment = $('<div>');
      attachment.addClass('jsxc_attachment');
      attachment.addClass('jsxc_' + message.attachment.type.replace(/\//, '-'));
      attachment.addClass('jsxc_' + message.attachment.type.replace(/^([^/]+)\/.*/, '$1'));

      if (message.attachment.persistent === false) {
        attachment.addClass('jsxc_notPersistent');
      }

      if (message.attachment.data) {
        attachment.addClass('jsxc_data');
      }

      if (message.attachment.type.match(/^image\//) && message.attachment.thumbnail) {
        $('<img alt="preview">').attr('src', message.attachment.thumbnail).attr('title',
            message.attachment.name).appendTo(attachment);
      } else {
        attachment.text(message.attachment.name);
      }

      if (message.attachment.data) {
        attachment = $('<a>').append(attachment);
        attachment.attr('href', message.attachment.data);
        attachment.attr('download', message.attachment.name);
      }

      msgDiv.find('div').first().append(attachment);
    }

    if (direction === 'sys') {
      jsxc.gui.window.get(bid).find('.jsxc_textarea').append('<div style="clear:both"/>');
    } else if (typeof message.stamp !== 'undefined') {
      msgDiv.append(msgTsDiv);
    }

    if (direction !== 'sys') {
      $('[data-bid="' + bid + '"]').find('.jsxc_lastmsg .jsxc_text').html(msg);
    }

    if (jsxc.Message.getDOM(uid).length > 0) {
      jsxc.Message.getDOM(uid).replaceWith(msgDiv);
    } else {
      win.find('.jsxc_textarea').append(msgDiv);
    }

    if (typeof message.sender === 'object' && message.sender !== null) {
      var title = '';
      var avatarDiv = $('<div>');
      avatarDiv.addClass('jsxc_avatar').prependTo(msgDiv);

      if (typeof message.sender.jid === 'string') {
        msgDiv.attr('data-bid', jsxc.jidToBid(message.sender.jid));

        var data = jsxc.storage.getUserItem('buddy', jsxc.jidToBid(message.sender.jid)) || {};
        jsxc.gui.updateAvatar(msgDiv, jsxc.jidToBid(message.sender.jid), data.avatar);

        title = jsxc.jidToBid(message.sender.jid);
      }

      if (typeof message.sender.name === 'string') {
        msgDiv.attr('data-name', message.sender.name);

        if (typeof message.sender.jid !== 'string') {
          jsxc.gui.avatarPlaceholder(avatarDiv, message.sender.name);
        }

        if (title !== '') {
          title = '\n' + title;
        }

        title = message.sender.name + title;

        msgTsDiv.text(msgTsDiv.text() + ' ' + message.sender.name);
      }

      avatarDiv.attr('title', jsxc.escapeHTML(title));

      if (msgDiv.prev().length > 0 &&
          msgDiv.prev().find('.jsxc_avatar').attr('title') === avatarDiv.attr('title')) {
        avatarDiv.css('visibility', 'hidden');
      }
    }

    jsxc.gui.detectUriScheme(win);
    jsxc.gui.detectEmail(win);

    jsxc.gui.window.scrollDown(bid);
  },

  /**
   * Set text into input area
   *
   * @param {type} bid
   * @param {type} text
   * @returns {undefined}
   */
  setText : function(bid, text) {
    jsxc.gui.window.get(bid).find('.jsxc_textinput').val(text);
  },

  /**
   * Load old log into chat area
   *
   * @param {type} bid
   * @returns {undefined}
   */
  restoreChat : function(bid) {
    var chat = jsxc.storage.getUserItem('chat', bid);

    // convert legacy storage structure introduced in v3.0.0
    if (chat) {
      while (chat !== null && chat.length > 0) {
        var c = chat.pop();

        c.bid = bid;
        c._uid = c.uid;
        delete c.uid;

        var message = new jsxc.Message(c);
        message.save();

        jsxc.gui.window._postMessage(message, true);
      }

      jsxc.storage.removeUserItem('chat', bid);
    }

    var history = jsxc.storage.getUserItem('history', bid);

    while (history !== null && history.length > 0) {
      var uid = history.pop();

      jsxc.gui.window._postMessage(new jsxc.Message(uid), true);
    }
  },

  /**
   * Clear chat history
   *
   * @param {type} bid
   * @returns {undefined}
   */
  clear : function(bid) {
    // deprecated
    jsxc.storage.removeUserItem('chat', bid);

    var history = jsxc.storage.getUserItem('history', bid) || [];

    history.map(function(id) {
      jsxc.storage.removeUserItem('msg', id);
    });

    jsxc.storage.setUserItem('history', bid, []);

    var win = jsxc.gui.window.get(bid);

    if (win.length > 0) {
      win.find('.jsxc_textarea').empty();
    }
  },

  /**
   * Mark message as received.
   *
   * @param  {string} bid
   * @param  {string} uid message id
   * @deprecated since v3.0.0. Use {@link jsxc.Message.received}.
   */
  receivedMessage : function(bid, uid) {
    jsxc.warn('Using deprecated receivedMessage.');

    var message = new jsxc.Message(uid);

    message.received();
  },

  updateProgress : function(message, sent, size) {
    var div = message.getDOM();
    var span = div.find('.jsxc_timestamp span');

    if (span.length === 0) {
      div.find('.jsxc_timestamp').append('<span>');
      span = div.find('.jsxc_timestamp span');
    }

    span.text(' ' + Math.round(sent / size * 100) + '%');

    if (sent === size) {
      span.remove();

      message.received();
    }
  },

  showOverlay : function(bid, content, allowClose) {
    var win = jsxc.gui.window.get(bid);

    win.find('.jsxc_overlay .jsxc_body').empty().append(content);
    win.find('.jsxc_overlay .jsxc_close').off('click').click(function() {
      jsxc.gui.window.hideOverlay(bid);
    });

    if (allowClose !== true) {
      win.find('.jsxc_overlay .jsxc_close').hide();
    } else {
      win.find('.jsxc_overlay .jsxc_close').show();
    }

    win.addClass('jsxc_showOverlay');
  },

  hideOverlay : function(bid) {
    var win = jsxc.gui.window.get(bid);

    win.removeClass('jsxc_showOverlay');
  },

  selectResource : function(bid, text, cb, res) {
    res = res || jsxc.storage.getUserItem('res', bid) || [];
    cb = cb || function() {
        };

    if (res.length > 0) {
      var content = $('<div>');
      var list = $('<ul>'), i, li;

      for (i = 0; i < res.length; i++) {
        li = $('<li>');

        li.append($('<a>').text(res[i]));
        li.appendTo(list);
      }

      list.find('a').click(function(ev) {
        ev.preventDefault();

        jsxc.gui.window.hideOverlay(bid);

        cb({
          status : 'selected', result : $(this).text()
        });
      });

      if (text) {
        $('<p>').text(text).appendTo(content);
      }

      list.appendTo(content);

      jsxc.gui.window.showOverlay(bid, content);
    } else {
      cb({
        status : 'unavailable'
      });
    }
  },

  smpRequest : function(bid, question) {
    var content = $('<div>');

    var p = $('<p>');
    p.text(jsxc.t('smpRequestReceived'));
    p.appendTo(content);

    var abort = $('<button>');
    abort.text(jsxc.t('Abort'));
    abort.click(function() {
      jsxc.gui.window.hideOverlay(bid);
      jsxc.storage.removeUserItem('smp', bid);

      if (jsxc.master && jsxc.otr.objects[bid]) {
        jsxc.otr.objects[bid].sm.abort();
      }
    });
    abort.appendTo(content);

    var verify = $('<button>');
    verify.text(jsxc.t('Verify'));
    verify.addClass('jsxc_btn jsxc_btn-primary');
    verify.click(function() {
      jsxc.gui.window.hideOverlay(bid);

      jsxc.otr.onSmpQuestion(bid, question);
    });
    verify.appendTo(content);

    jsxc.gui.window.showOverlay(bid, content);
  },

  sendFile : function(jid) {
    var bid = jsxc.jidToBid(jid);
    var win = jsxc.gui.window.get(bid);
    var res = Strophe.getResourceFromJid(jid);

    if (!res) {
      jid = win.data('jid');
      res = Strophe.getResourceFromJid(jid);

      var fileCapableRes = jsxc.webrtc.getCapableRes(jid, jsxc.webrtc.reqFileFeatures);
      var resources = Object.keys(jsxc.storage.getUserItem('res', bid)) || [];

      if (res === null && resources.length === 1 && fileCapableRes.length === 1) {
        res = fileCapableRes[0];
        jid = bid + '/' + res;
      } else if (fileCapableRes.indexOf(res) < 0) {
        jsxc.gui.window.selectResource(bid, jsxc.t('Your_contact_uses_multiple_clients_'),
            function(data) {
              if (data.status === 'unavailable') {
                jsxc.gui.window.hideOverlay(bid);
              } else if (data.status === 'selected') {
                jsxc.gui.window.sendFile(bid + '/' + data.result);
              }
            }, fileCapableRes);

        return;
      }
    }

    var msg = $('<div><div><label><input type="file" name="files" /><label></div></div>');
    msg.addClass('jsxc_chatmessage');

    jsxc.gui.window.showOverlay(bid, msg, true);

    msg.find('label').click();

    msg.find('[type="file"]').change(function(ev) {
      var file = ev.target.files[0]; // FileList object

      if (!file) {
        return;
      }

      var attachment = $('<div>');
      attachment.addClass('jsxc_attachment');
      attachment.addClass('jsxc_' + file.type.replace(/\//, '-'));
      attachment.addClass('jsxc_' + file.type.replace(/^([^/]+)\/.*/, '$1'));

      msg.empty().append(attachment);

      if (FileReader && file.type.match(/^image\//)) {
        var img = $('<img alt="preview">').attr('title', file.name);
        img.attr('src', jsxc.options.get('root') + '/img/loading.gif');
        img.appendTo(attachment);

        var reader = new FileReader();

        reader.onload = function() {
          img.attr('src', reader.result);
        };

        reader.readAsDataURL(file);
      } else {
        attachment.text(file.name + ' (' + file.size + ' byte)');
      }

      $('<button>').addClass('jsxc_btn jsxc_btn-primary').text(jsxc.t('Send')).click(function() {
        var sess = jsxc.webrtc.sendFile(jid, file);

        jsxc.gui.window.hideOverlay(bid);

        var message = jsxc.gui.window.postMessage({
          _uid : sess.sid + ':msg', bid : bid, direction : 'out', attachment : {
            name : file.name,
            size : file.size,
            type : file.type,
            data : (file.type.match(/^image\//)) ? img.attr('src') : null
          }
        });

        sess.sender.on('progress', function(sent, size) {
          jsxc.gui.window.updateProgress(message, sent, size);
        });

        msg.remove();

      }).appendTo(msg);

      $('<button>').addClass('jsxc_btn jsxc_btn-default').text(jsxc.t('Abort')).click(function() {
        jsxc.gui.window.hideOverlay(bid);
      }).appendTo(msg);
    });
  }
};
