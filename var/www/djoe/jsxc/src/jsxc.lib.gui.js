/* global Favico, emojione*/
/**
 * Handle functions for chat window's and buddylist
 *
 * @namespace jsxc.gui
 */
jsxc.gui = {
  /** Smilie token to file mapping */
  emotions : [['O:-) O:)', 'innocent'], ['>:-( >:( &gt;:-( &gt;:(', 'angry'],
    [':-) :)', 'slight_smile'], [':-D :D', 'grin'], [':-( :(', 'disappointed'], [';-) ;)', 'wink'],
    [':-P :P', 'stuck_out_tongue'], ['=-O', 'astonished'], [':kiss: :-*', 'kissing_heart'],
    ['8-) :cool:', 'sunglasses'], [':-X :X', 'zipper_mouth'], [':yes:', 'thumbsup'],
    [':no:', 'thumbsdown'], [':beer:', 'beer'], [':coffee:', 'coffee'], [':devil:', 'smiling_imp'],
    [':kiss: :kissing:', 'kissing'], ['@->-- @-&gt;--', 'rose'], [':music:', 'musical_note'],
    [':love:', 'heart_eyes'], [':heart:', 'heart'], [':brokenheart:', 'broken_heart'],
    [':zzz:', 'zzz'], [':wait:', 'hand_splayed']],

  favicon : null,

  regShortNames : null,

  emoticonList : {
    'core' : {
      ':klaus:' : ['klaus'],
      ':jabber:' : ['jabber'],
      ':xmpp:' : ['xmpp'],
      ':jsxc:' : ['jsxc'],
      ':owncloud:' : ['owncloud']
    }, 'emojione' : emojione.emojioneList
  },

  /**
   * Different uri query actions as defined in XEP-0147.
   *
   * @namespace jsxc.gui.queryActions
   */
  queryActions : {
    /** xmpp:JID?message[;body=TEXT] */
    message : function(jid, params) {
      var win = jsxc.gui.window.open(jsxc.jidToBid(jid));

      if (params && typeof params.body === 'string') {
        win.find('.jsxc_textinput').val(params.body);
      }
    },

    /** xmpp:JID?remove */
    remove : function(jid) {
      jsxc.gui.showRemoveDialog(jsxc.jidToBid(jid));
    },

    /** xmpp:JID?subscribe[;name=NAME] */
    subscribe : function(jid, params) {
      jsxc.gui.showContactDialog(jid);

      if (params && typeof params.name) {
        $('#jsxc_alias').val(params.name);
      }
    },

    /** xmpp:JID?vcard */
    vcard : function(jid) {
      jsxc.gui.showVcard(jid);
    },

    /** xmpp:JID?join[;password=TEXT] */
    join : function(jid, params) {
      var password = (params && params.password) ? params.password : null;

      jsxc.muc.showJoinChat(jid, password);
    }
  },

  /**
   * Creates application skeleton.
   *
   * This function is called every time we are attached
   *
   * @memberOf jsxc.gui
   */
  init : function() {

    // Prevent duplicate windowList
    if ($('#jsxc_windowList').length > 0) {
      return;
    }

    jsxc.gui.regShortNames = new RegExp(emojione.regShortNames.source + '|(' +
        Object.keys(jsxc.gui.emoticonList.core).join('|') + ')', 'gi');

    $('body').append($(jsxc.gui.template.get('windowList')));

    $(window).resize(jsxc.gui.updateWindowListSB);
    $('#jsxc_windowList').resize(jsxc.gui.updateWindowListSB);

    $('#jsxc_windowListSB .jsxc_scrollLeft').click(function() {
      jsxc.gui.scrollWindowListBy(-200);
    });
    $('#jsxc_windowListSB .jsxc_scrollRight').click(function() {
      jsxc.gui.scrollWindowListBy(200);
    });
    $('#jsxc_windowList').on('wheel', function(ev) {
      if ($('#jsxc_windowList').data('isOver')) {
        jsxc.gui.scrollWindowListBy((ev.originalEvent.wheelDelta > 0) ? 200 : -200);
      }
    });

    jsxc.gui.tooltip('#jsxc_windowList');

    var fo = jsxc.options.get('favicon');
    if (fo && fo.enable) {
      jsxc.gui.favicon = new Favico({
        animation : 'pop', bgColor : fo.bgColor, textColor : fo.textColor
      });

      jsxc.gui.favicon.badge(jsxc.storage.getUserItem('unreadMsg') || 0);
    }

    if (!jsxc.el_exists('#jsxc_roster')) {
      jsxc.gui.roster.init();
    }

    // prepare regexp for emotions
    $.each(jsxc.gui.emotions, function(i, val) {
      // escape characters
      var reg = val[0].replace(/(\/|\||\*|\.|\+|\?|\^|\$|\(|\)|\[|\]|\{|\})/g, '\\$1');
      reg = '(' + reg.split(' ').join('|') + ')';
      jsxc.gui.emotions[i][2] = new RegExp(reg, 'g');
    });

    // We need this often, so we creates some template jquery objects
    jsxc.gui.windowTemplate = $(jsxc.gui.template.get('chatWindow'));
    jsxc.gui.buddyTemplate = $(jsxc.gui.template.get('rosterBuddy'));

    // change own presence informations
    var updatePresenceInformations = function(event, pres) {
      jsxc.gui.updatePresence('own', pres);
    };
    // add listener for own presences, and remove it on time
    $(document).on('ownpresence.jsxc', updatePresenceInformations);
    $(document).on('disconnected.jsxc', function() {
      $(document).off('ownpresence.jsxc', updatePresenceInformations);
    });
  },

  /**
   * Init tooltip plugin for given jQuery selector.
   *
   * @param {String} selector jQuery selector
   * @memberOf jsxc.gui
   */
  tooltip : function(selector) {
    $(selector).tooltip({
      tooltipClass : "jsxc-custom-tooltip", show : {
        delay : 1000
      }, content : function() {
        return $(this).attr('title').replace(/\n/g, '<br />');
      }
    });
  },

  /**
   * Updates Information in roster and chatbar
   *
   * @param {String} bid bar jid
   */
  update : function(bid) {
    var data = jsxc.storage.getUserItem('buddy', bid);

    if (!data) {
      jsxc.debug('No data for ' + bid);
      return;
    }

    var ri = jsxc.gui.roster.getItem(bid); // roster item from user
    var we = jsxc.gui.window.get(bid); // window element from user
    var ue = ri.add(we); // both
    var spot = $('.jsxc_spot[data-bid="' + bid + '"]');

    // Attach data to corresponding roster item
    ri.data(data);

    // Add online status
    jsxc.gui.updatePresence(bid, jsxc.CONST.STATUS[data.status]);

    // limite name length to preserve ticks
    var max = 21;
    var dspName = "";
    if (data.name) {
      dspName = data.name.length > max ? data.name.substring(0, max - 3) + "..." : data.name;
    }

    // Change name and add title
    ue.find('.jsxc_name:first').add(spot).text(dspName).attr('title', jsxc.t('is_', {
      status : jsxc.t(jsxc.CONST.STATUS[data.status])
    }));

    // if(window.location.protocol === "https:"){
    //     we.find('.jsxc_transfer').addClass('jsxc_enc').attr('title',
    // jsxc.t('your_connection_is_encrypted')); we.find('.jsxc_settings
    // .jsxc_verification').removeClass('jsxc_disabled'); we.find('.jsxc_settings
    // .jsxc_transfer').text(jsxc.t('close_private')); }  else {
    // we.find('.jsxc_transfer').removeClass('jsxc_enc jsxc_fin').attr('title',
    // jsxc.t('your_connection_is_unencrypted')); we.find('.jsxc_settings
    // .jsxc_verification').addClass('jsxc_disabled'); we.find('.jsxc_settings
    // .jsxc_transfer').text(jsxc.t('start_private')); }

    // Update gui according to encryption state
    switch (data.msgstate) {
      case 0:
        we.find('.jsxc_transfer').removeClass('jsxc_enc jsxc_fin').attr('title',
            jsxc.t('your_connection_is_unencrypted'));
        we.find('.jsxc_settings .jsxc_verification').addClass('jsxc_disabled');
        we.find('.jsxc_settings .jsxc_transfer').text(jsxc.t('start_private'));
        break;
      case 1:
        we.find('.jsxc_transfer').addClass('jsxc_enc').attr('title',
            jsxc.t('your_connection_is_encrypted'));
        we.find('.jsxc_settings .jsxc_verification').removeClass('jsxc_disabled');
        we.find('.jsxc_settings .jsxc_transfer').text(jsxc.t('close_private'));
        break;
      case 2:
        we.find('.jsxc_settings .jsxc_verification').addClass('jsxc_disabled');
        we.find('.jsxc_transfer').removeClass('jsxc_enc').addClass('jsxc_fin').attr('title',
            jsxc.t('your_buddy_closed_the_private_connection'));
        we.find('.jsxc_settings .jsxc_transfer').text(jsxc.t('close_private'));
        break;
    }

    // update gui according to verification state
    if (data.trust) {
      we.find('.jsxc_transfer').addClass('jsxc_trust').attr('title',
          jsxc.t('your_buddy_is_verificated'));
    } else {
      we.find('.jsxc_transfer').removeClass('jsxc_trust');
    }

    // update gui according to subscription state
    if (data.sub && data.sub !== 'both') {
      ue.addClass('jsxc_oneway');
    } else {
      ue.removeClass('jsxc_oneway');
    }

    var info = Strophe.getBareJidFromJid(data.jid) + '\n';
    info += jsxc.t('Subscription') + ': ' + jsxc.t(data.sub) + '\n';
    info += jsxc.t('Status') + ': ' + jsxc.t(jsxc.CONST.STATUS[data.status]);

    ri.find('.jsxc_name').attr('title', info);

    jsxc.gui.updateAvatar(ri.add(we.find('.jsxc_bar')), data.jid, data.avatar);
  },

  /**
   * Update avatar on all given elements.
   *
   * @memberOf jsxc.gui
   * @param {jQuery} el Elements with subelement .jsxc_avatar
   * @param {string} jid Jid
   * @param {string} aid Avatar id (sha1 hash of image)
   */
  updateAvatar : function(el, jid, aid) {

    var setAvatar = function(src) {
      if (src === 0 || src === '0') {
        if (typeof jsxc.options.defaultAvatar === 'function') {
          jsxc.options.defaultAvatar.call(el, jid);
          return;
        }
        jsxc.gui.avatarPlaceholder(el.find('.jsxc_avatar'), jid);
        return;
      }

      el.find('.jsxc_avatar').removeAttr('style');

      el.find('.jsxc_avatar').css({
        'background-image' : 'url(' + src + ')', 'text-indent' : '999px'
      });
    };

    if (typeof aid === 'undefined') {
      setAvatar(0);
      return;
    }

    var avatarSrc = jsxc.storage.getUserItem('avatar', aid);

    if (avatarSrc !== null) {
      setAvatar(avatarSrc);
    } else {
      var handler_cb = function(stanza) {
        jsxc.debug('vCard', stanza);

        var vCard = $(stanza).find("vCard > PHOTO");
        var src;

        if (vCard.length === 0) {
          jsxc.debug('No photo provided');
          src = '0';
        } else if (vCard.find('EXTVAL').length > 0) {
          src = vCard.find('EXTVAL').text();
        } else {
          var img = vCard.find('BINVAL').text();
          var type = vCard.find('TYPE').text();
          src = 'data:' + type + ';base64,' + img;
        }

        // concat chunks
        src = src.replace(/[\t\r\n\f]/gi, '');

        jsxc.storage.setUserItem('avatar', aid, src);
        setAvatar(src);
      };

      var error_cb = function(msg) {
        jsxc.warn('Could not load vcard.', msg);

        jsxc.storage.setUserItem('avatar', aid, 0);
        setAvatar(0);
      };

      // workaround for https://github.com/strophe/strophejs/issues/172
      if (Strophe.getBareJidFromJid(jid) === Strophe.getBareJidFromJid(jsxc.xmpp.conn.jid)) {
        jsxc.xmpp.conn.vcard.get(handler_cb, error_cb);
      } else {
        jsxc.xmpp.conn.vcard.get(handler_cb, Strophe.getBareJidFromJid(jid), error_cb);
      }
    }
  },

  /**
   * Updates scrollbar handlers.
   *
   * @memberOf jsxc.gui
   */
  updateWindowListSB : function() {

    if ($('#jsxc_windowList>ul').width() > $('#jsxc_windowList').width()) {
      $('#jsxc_windowListSB > div').removeClass('jsxc_disabled');
    } else {
      $('#jsxc_windowListSB > div').addClass('jsxc_disabled');
      $('#jsxc_windowList>ul').css('right', '0px');
    }
  },

  /**
   * Scroll window list by offset.
   *
   * @memberOf jsxc.gui
   * @param offset
   */
  scrollWindowListBy : function(offset) {

    var scrollWidth = $('#jsxc_windowList>ul').width();
    var width = $('#jsxc_windowList').width();
    var el = $('#jsxc_windowList>ul');
    var right = parseInt(el.css('right')) - offset;
    var padding = $("#jsxc_windowListSB").width();

    if (scrollWidth < width) {
      return;
    }

    if (right > 0) {
      right = 0;
    }

    if (right < width - scrollWidth - padding) {
      right = width - scrollWidth - padding;
    }

    el.css('right', right + 'px');
  },

  /**
   * Returns the window element
   *
   * @deprecated Use {@link jsxc.gui.window.get} instead.
   * @param {String} bid
   * @returns {jquery} jQuery object of the window element
   */
  getWindow : function(bid) {

    jsxc.warn('jsxc.gui.getWindow is deprecated!');

    return jsxc.gui.window.get(bid);
  },

  /**
   Transform list in menu. Structure must be like that:
   <container id="idToPass">
   <ul>
   <li>Menu elements 1</li>
   <li>Menu elements 2</li>
   <li>Menu elements ...</li>
   </ul>
   </container>

   With timeout for closing

   * @memberof jsxc.gui
   */
  toggleList : function(el) {

    var self = el || $(this);

    self.disableSelection();

    self.addClass('jsxc_list');

    var ul = self.find('ul');
    var slideUp = null;

    slideUp = function() {

      self.removeClass('jsxc_opened');

      $('body').off('click', null, slideUp);
    };

    $(this).click(function() {

      if (!self.hasClass('jsxc_opened')) {
        // hide other lists
        $('body').click();
        $('body').one('click', slideUp);
      } else {
        $('body').off('click', null, slideUp);
      }

      window.clearTimeout(ul.data('timer'));

      self.toggleClass('jsxc_opened');

      return false;

    }).mouseleave(function() {
      ul.data('timer', window.setTimeout(slideUp, 2000));
    }).mouseenter(function() {
      window.clearTimeout(ul.data('timer'));
    });
  },

  /**
   * Creates and show loginbox
   */
  showLoginBox : function() {
    // Set focus to password field
    $(document).on("complete.dialog.jsxc", function() {
      $('#jsxc_password').focus();
    });

    jsxc.gui.dialog.open(jsxc.gui.template.get('loginBox'));

    var alert = $('#jsxc_dialog').find('.jsxc_alert');
    alert.hide();

    $('#jsxc_dialog').find('form').submit(function(ev) {

      ev.preventDefault();

      $(this).find('button[data-jsxc-loading-text]').trigger('btnloading.jsxc');

      jsxc.options.loginForm.form = $(this);
      jsxc.options.loginForm.jid = $(this).find('#jsxc_username');
      jsxc.options.loginForm.pass = $(this).find('#jsxc_password');

      jsxc.triggeredFromBox = true;
      jsxc.options.loginForm.triggered = false;

      jsxc.prepareLogin(function(settings) {
        if (settings === false) {
          onAuthFail();
        } else {
          $(document).on('authfail.jsxc', onAuthFail);

          jsxc.xmpp.login();
        }
      });
    });

    function onAuthFail() {
      alert.show();
      jsxc.gui.dialog.resize();

      $('#jsxc_dialog').find('button').trigger('btnfinished.jsxc');

      $('#jsxc_dialog').find('input').one('keypress', function() {
        alert.hide();
        jsxc.gui.dialog.resize();
      });
    }
  },

  /**
   * Creates and show the fingerprint dialog
   *
   * @param {String} bid
   */
  showFingerprints : function(bid) {
    jsxc.gui.dialog.open(jsxc.gui.template.get('fingerprintsDialog', bid));
  },

  /**
   * Creates and show the verification dialog
   *
   * @param {String} bid
   */
  showVerification : function(bid) {

    // Check if there is a open dialog
    if ($('#jsxc_dialog').length > 0) {
      setTimeout(function() {
        jsxc.gui.showVerification(bid);
      }, 3000);
      return;
    }

    // verification only possible if the connection is encrypted
    if (jsxc.storage.getUserItem('buddy', bid).msgstate !== OTR.CONST.MSGSTATE_ENCRYPTED) {
      jsxc.warn('Connection not encrypted');
      return;
    }

    jsxc.gui.dialog.open(jsxc.gui.template.get('authenticationDialog', bid), {
      name : 'smp'
    });

    // Add handler

    $('#jsxc_dialog > div:gt(0)').hide();
    $('#jsxc_dialog > div:eq(0) button').click(function() {

      $(this).siblings().removeClass('active');
      $(this).addClass('active');
      $(this).get(0).blur();

      $('#jsxc_dialog > div:gt(0)').hide();
      $('#jsxc_dialog > div:eq(' + ($(this).index() + 1) + ')').show().find('input:first').focus();
    });

    // Manual
    $('#jsxc_dialog > div:eq(1) .jsxc_submit').click(function() {
      if (jsxc.master) {
        jsxc.otr.objects[bid].trust = true;
      }

      jsxc.storage.updateUserItem('buddy', bid, 'trust', true);

      jsxc.gui.dialog.close('smp');

      jsxc.storage.updateUserItem('buddy', bid, 'trust', true);
      jsxc.gui.window.postMessage({
        bid : bid, direction : jsxc.Message.SYS, msg : jsxc.t('conversation_is_now_verified')
      });
      jsxc.gui.update(bid);
    });

    // Question
    $('#jsxc_dialog > div:eq(2) .jsxc_submit').click(function() {
      var div = $('#jsxc_dialog > div:eq(2)');
      var sec = div.find('#jsxc_secret2').val();
      var quest = div.find('#jsxc_quest').val();

      if (sec === '' || quest === '') {
        // Add information for the user which form is missing
        div.find('input[value=""]').addClass('jsxc_invalid').keyup(function() {
          if ($(this).val().match(/.*/)) {
            $(this).removeClass('jsxc_invalid');
          }
        });
        return;
      }

      if (jsxc.master) {
        jsxc.otr.sendSmpReq(bid, sec, quest);
      } else {
        jsxc.storage.setUserItem('smp', bid, {
          sec : sec, quest : quest
        });
      }

      jsxc.gui.dialog.close('smp');

      jsxc.gui.window.postMessage({
        bid : bid, direction : jsxc.Message.SYS, msg : jsxc.t('authentication_query_sent')
      });
    });

    // Secret
    $('#jsxc_dialog > div:eq(3) .jsxc_submit').click(function() {
      var div = $('#jsxc_dialog > div:eq(3)');
      var sec = div.find('#jsxc_secret').val();

      if (sec === '') {
        // Add information for the user which form is missing
        div.find('#jsxc_secret').addClass('jsxc_invalid').keyup(function() {
          if ($(this).val().match(/.*/)) {
            $(this).removeClass('jsxc_invalid');
          }
        });
        return;
      }

      if (jsxc.master) {
        jsxc.otr.sendSmpReq(bid, sec);
      } else {
        jsxc.storage.setUserItem('smp', bid, {
          sec : sec, quest : null
        });
      }

      jsxc.gui.dialog.close('smp');

      jsxc.gui.window.postMessage({
        bid : bid, direction : 'sys', msg : jsxc.t('authentication_query_sent')
      });
    });
  },

  /**
   * Create and show approve dialog
   *
   * @param {type} from valid jid
   */
  showApproveDialog : function(from) {
    jsxc.gui.dialog.open(jsxc.gui.template.get('approveDialog'), {
      'noClose' : true
    });

    $('#jsxc_dialog .jsxc_their_jid').text(Strophe.getBareJidFromJid(from));

    $('#jsxc_dialog .jsxc_deny').click(function(ev) {
      ev.stopPropagation();

      jsxc.xmpp.resFriendReq(from, false);

      jsxc.gui.dialog.close();
    });

    $('#jsxc_dialog .jsxc_approve').click(function(ev) {
      ev.stopPropagation();

      var data = jsxc.storage.getUserItem('buddy', jsxc.jidToBid(from));

      jsxc.xmpp.resFriendReq(from, true);

      // If friendship is not mutual show contact dialog
      if (!data || data.sub === 'from') {
        jsxc.gui.showContactDialog(from);
      }
    });
  },

  /**
   * Create and show join discussion dialog
   *
   * @param {type} from valid jid
   */
  showJoinConversationDialog : function(roomjid, buddyName) {

    jsxc.gui.dialog.open(jsxc.gui.template.get('joinConversationDialog'), {
      'noClose' : true
    });

    $('#jsxc_dialog .jsxc_buddyName').text(Strophe.getBareJidFromJid(buddyName));

    $('#jsxc_dialog .jsxc_deny').click(function(ev) {
      ev.stopPropagation();

      jsxc.gui.feedback("Invitation refusée");

      jsxc.gui.dialog.close();
    });

    $('#jsxc_dialog .jsxc_approve').click(function(ev) {
      ev.stopPropagation();

      jsxc.gui.dialog.close();

      // clean up
      jsxc.gui.window.clear(roomjid);
      jsxc.storage.setUserItem('member', roomjid, {});

      // TODO: set title and subject ?
      jsxc.muc.join(roomjid, jsxc.xmpp.getCurrentNode(), null, null, null, true, true);

      // open window
      jsxc.gui.window.open(roomjid);
    });
  },

  /**
   * Create and show dialog to add a buddy
   *
   * @param {string} [username] jabber id
   */
  showContactDialog : function(username) {
    jsxc.gui.dialog.open(jsxc.gui.template.get('contactDialog'));

    // If we got a friendship request, we would display the username in our
    // response
    if (username) {
      $('#jsxc_username').val(username);
    }

    $('#jsxc_username').keyup(function() {
      if (typeof jsxc.options.getUsers === 'function') {
        var val = $(this).val();
        $('#jsxc_userlist').empty();

        if (val !== '') {
          jsxc.options.getUsers.call(this, val, function(list) {
            $.each(list || {}, function(uid, displayname) {
              var option = $('<option>');
              option.attr('data-username', uid);
              option.attr('data-alias', displayname);

              option.attr('value', uid).appendTo('#jsxc_userlist');

              if (uid !== displayname) {
                option.clone().attr('value', displayname).appendTo('#jsxc_userlist');
              }
            });
          });
        }
      }
    });

    $('#jsxc_username').on('input', function() {
      var val = $(this).val();
      var option = $('#jsxc_userlist').find(
          'option[data-username="' + val + '"], option[data-alias="' + val + '"]');

      if (option.length > 0) {
        $('#jsxc_username').val(option.attr('data-username'));
        $('#jsxc_alias').val(option.attr('data-alias'));
      }
    });

    $('#jsxc_dialog form').submit(function(ev) {
      ev.preventDefault();

      var username = $('#jsxc_username').val();
      var alias = $('#jsxc_alias').val();

      if (!username.match(/@(.*)$/)) {
        username += '@' + Strophe.getDomainFromJid(jsxc.storage.getItem('jid'));
      }

      // Check if the username is valid
      if (!username || !username.match(jsxc.CONST.REGEX.JID)) {
        // Add notification
        $('#jsxc_username').addClass('jsxc_invalid').keyup(function() {
          if ($(this).val().match(jsxc.CONST.REGEX.JID)) {
            $(this).removeClass('jsxc_invalid');
          }
        });
        return false;
      }
      jsxc.xmpp.addBuddy(username, alias);

      jsxc.gui.dialog.close();

      return false;
    });
  },

  /**
   * Create and show dialog to remove a buddy
   *
   * @param {type} bid
   * @returns {undefined}
   */
  showRemoveDialog : function(bid) {

    jsxc.gui.dialog.open(jsxc.gui.template.get('removeDialog', bid));

    var data = jsxc.storage.getUserItem('buddy', bid);

    $('#jsxc_dialog .jsxc_remove').click(function(ev) {
      ev.stopPropagation();

      if (jsxc.master) {
        jsxc.xmpp.removeBuddy(data.jid);
      } else {
        // inform master
        jsxc.storage.setUserItem('deletebuddy', bid, {
          jid : data.jid
        });
      }

      jsxc.gui.dialog.close();
    });
  },

  showRemoveManyDialog : function(bidArray) {

    // show dialog
    jsxc.gui.dialog.open(jsxc.gui.template.get('removeManyDialog'));

    var templateList = $('#jsxc_dialog .jsxc_elementsToRemove');

    // show what will be deleted
    $.each(bidArray, function(index, element) {
      templateList.append($("<li>").text(element));
    });

    // delete if OK
    $('#jsxc_dialog .jsxc_remove').click(function(ev) {
      ev.stopPropagation();

      $.each(bidArray, function(index, element) {

        var data = jsxc.storage.getUserItem('buddy', element);
        var type = data.type;

        jsxc.xmpp.removeBuddy(element);

        if (type === "groupchat") {
          jsxc.xmpp.bookmarks.delete(element, false);
        }

      });

      // close dialog
      jsxc.gui.dialog.close();

      jsxc.gui.feedback(bidArray.length + " éléments ont été supprimés");
    });

    $('#jsxc_dialog .jsxc_cancel').click(function() {
      jsxc.gui.dialog.close();
      jsxc.gui.feedback("Opération annulée");
    });

  },

  /**
   * Show a feedback message. Type can be 'info' or 'warn'
   *
   * @param selector
   * @returns {JQuery|jQuery|HTMLElement}
   */
  feedback : function(message, type, timeout) {

    jsxc.stats.addEvent("jsxc.feedback.toast");

    var defaultType = "info";

    var bgColors = {
      info : '#1a1a1a', warn : '#520400',
    };
    var icons = {
      info : 'info', warn : 'warning',
    };

    // show the toast
    $.toast({
      text : message, // Text that is to be shown in the toast
      icon : icons[type || defaultType], // Type of toast icon
      showHideTransition : 'slide', // fade, slide or plain
      allowToastClose : true, // Boolean value true or false
      hideAfter : timeout || 3000, // false to make it sticky or number representing the miliseconds
                                   // as time after which toast needs to be hidden
      stack : 3, // false if there should be only one toast at a time or a number representing the
                 // maximum number of toasts to be shown at a time
      position : 'top-center', // bottom-left or bottom-right or bottom-center or top-left or
                               // top-right or top-center or mid-center or an object representing
                               // the left, right, top, bottom values
      textAlign : 'left',  // Text alignment i.e. left, right or center
      loader : false,  // Whether to show loader or not. True by default
      bgColor : bgColors[type || defaultType], // background color of toast
    });

  },

  /**
   * Show a dialog asking for new etherpad document name, and return a promise
   */
  showEtherpadCreationDialog : function() {

    var defer = $.Deferred();

    // show dialog
    jsxc.gui.dialog.open(jsxc.gui.template.get('etherpadCreation'));

    // create user list to invite
    jsxc.gui.widgets.createBuddyList("#jsxc_dialog #jsxc_dialog_buddylist");

    $('#jsxc_dialog .jsxc_confirm').click(function(ev) {
      ev.stopPropagation();

      // get name of pad
      var name = $("#jsxc_dialog .jsxc-etherpad-name").val();

      // get selected items
      var jids = [];
      var selectedItems = $("#jsxc_dialog #jsxc_dialog_buddylist .jsxc-checked");
      $.each(selectedItems, function(index, item) {
        jids.push($(item).data('bid'));
      });

      jsxc.gui.dialog.close();

      defer.resolve({
        name : name, buddies : jids
      });

    });

    $('#jsxc_dialog .jsxc_cancel').click(function(ev) {
      ev.stopPropagation();

      jsxc.gui.dialog.close();

      defer.reject("user canceled");

    });

    return defer.promise();

  },

  /**
   * Show a dialog asking for new etherpad document name, and return a promise
   */
  showIncomingEtherpadDialog : function(from) {

    var defer = $.Deferred();

    // show dialog
    jsxc.gui.dialog.open(jsxc.gui.template.get('incomingEtherpad', from));

    $('#jsxc_dialog .jsxc_confirm').click(function(ev) {
      ev.stopPropagation();

      jsxc.gui.dialog.close();

      defer.resolve("accepted");

    });

    $('#jsxc_dialog .jsxc_cancel').click(function(ev) {
      ev.stopPropagation();

      jsxc.gui.dialog.close();

      defer.reject("user canceled");

    });

    return defer.promise();

  },

  /**
   * Show a dialog to select a conversation
   *
   * @param {type} bid
   * @returns {undefined}
   */
  showConversationSelectionDialog : function() {

    var defer = $.Deferred();

    jsxc.gui.dialog.open(jsxc.gui.template.get('conversationSelectionDialog'));

    jsxc.gui.widgets.createConversationList("#jsxc_dialogConversationList");

    $('#jsxc_dialog .jsxc_confirm').click(function(ev) {
      ev.stopPropagation();

      // get selected elements
      var selItems = $("#jsxc_dialogConversationList .jsxc-checked");
      var res = [];

      $.each(selItems, function(index, element) {
        res.push($(element).data('conversjid'));
      });

      jsxc.gui.dialog.close();

      defer.resolve(res);

    });

    $('#jsxc_dialog .jsxc_cancel').click(function(ev) {
      ev.stopPropagation();

      defer.reject("user canceled");

    });

    return defer.promise();
  },

  /**
   * Create and show a wait dialog
   *
   * @param {type} msg message to display to the user
   * @returns {undefined}
   */
  showWaitAlert : function(msg) {
    jsxc.gui.dialog.open(jsxc.gui.template.get('waitAlert', null, msg), {
      'noClose' : true
    });
  },

  /**
   * Create and show a wait dialog
   *
   * @param {type} msg message to display to the user
   * @returns {undefined}
   */
  showAlert : function(msg) {
    jsxc.gui.dialog.open(jsxc.gui.template.get('alert', null, msg));
  },

  /**
   * Create and show a auth fail dialog
   *
   * @returns {undefined}
   */
  showAuthFail : function() {
    jsxc.gui.dialog.open(jsxc.gui.template.get('authFailDialog'));

    if (jsxc.options.loginForm.triggered !== false) {
      $('#jsxc_dialog .jsxc_cancel').hide();
    }

    $('#jsxc_dialog .jsxc_retry').click(function() {
      jsxc.gui.dialog.close();
    });

    $('#jsxc_dialog .jsxc_cancel').click(function() {
      jsxc.submitLoginForm();
    });
  },

  /**
   * Create and show a confirm dialog
   *
   * @param {String} msg Message
   * @param {function} confirm
   * @param {function} dismiss
   * @returns {undefined}
   */
  showConfirmDialog : function(msg, confirm, dismiss) {
    jsxc.gui.dialog.open(jsxc.gui.template.get('confirmDialog', null, msg), {
      noClose : true
    });

    if (confirm) {
      $('#jsxc_dialog .jsxc_confirm').click(confirm);
    }

    if (dismiss) {
      $('#jsxc_dialog .jsxc_dismiss').click(dismiss);
    }
  },

  /**
   * Show about dialog.
   *
   * @memberOf jsxc.gui
   */
  showAboutDialog : function() {
    jsxc.gui.dialog.open(jsxc.gui.template.get('aboutDialog'));

    $('#jsxc_dialog .jsxc_debuglog').click(function() {
      jsxc.gui.showDebugLog();
    });

    $('#jsxc_dialog .jsxc_spaceInvasion').click(function() {
      jsxc.api.spaceInvasion();
    });
  },

  /**
   * Show debug log.
   *
   * @memberOf jsxc.gui
   */
  showDebugLog : function() {
    var userInfo = '<h3>User information</h3>';

    if (navigator) {
      var key;
      for (key in navigator) {
        if (typeof navigator[key] === 'string') {
          userInfo += '<b>' + key + ':</b> ' + navigator[key] + '<br />';
        }
      }
    }

    if ($.fn && $.fn.jquery) {
      userInfo += '<b>jQuery:</b> ' + $.fn.jquery + '<br />';
    }

    if (window.screen) {
      userInfo += '<b>Height:</b> ' + window.screen.height + '<br />';
      userInfo += '<b>Width:</b> ' + window.screen.width + '<br />';
    }

    userInfo += '<b>jsxc version:</b> ' + jsxc.version + '<br />';

    jsxc.gui.dialog.open(
        '<div class="jsxc_log">' + userInfo + '<h3>Log</h3><pre>' + jsxc.escapeHTML(jsxc.log) +
        '</pre></div>');
  },

  /**
   * Show vCard of user with the given bar jid.
   *
   * @memberOf jsxc.gui
   * @param {String} jid
   */
  showVcard : function(jid) {
    var bid = jsxc.jidToBid(jid);
    jsxc.gui.dialog.open(jsxc.gui.template.get('vCard', bid));

    var data = jsxc.storage.getUserItem('buddy', bid);

    if (data) {
      // Display resources and corresponding information
      var i, j, res, identities, identity = null, cap, client;
      for (i = 0; i < data.res.length; i++) {
        res = data.res[i];

        identities = [];
        cap = jsxc.xmpp.getCapabilitiesByJid(bid + '/' + res);

        if (cap !== null && cap.identities !== null) {
          identities = cap.identities;
        }

        client = '';
        for (j = 0; j < identities.length; j++) {
          identity = identities[j];
          if (identity.category === 'client') {
            if (client !== '') {
              client += ',\n';
            }

            client += identity.name + ' (' + identity.type + ')';
          }
        }

        var status = jsxc.storage.getUserItem('res', bid)[res];

        $('#jsxc_dialog ul.jsxc_vCard').append(
            '<li class="jsxc_sep"><strong>' + jsxc.t('Resource') + ':</strong> ' + res + '</li>');
        $('#jsxc_dialog ul.jsxc_vCard').append(
            '<li><strong>' + jsxc.t('Client') + ':</strong> ' + client + '</li>');
        $('#jsxc_dialog ul.jsxc_vCard').append(
            '<li><strong>' + jsxc.t('Status') + ':</strong> ' + jsxc.t(jsxc.CONST.STATUS[status]) +
            '</li>');
      }
    }

    var printProp = function(el, depth) {
      var content = '';

      el.each(function() {
        var item = $(this);
        var children = $(this).children();

        content += '<li>';

        var prop = jsxc.t(item[0].tagName);

        if (prop !== ' ') {
          content += '<strong>' + prop + ':</strong> ';
        }

        if (item[0].tagName === 'PHOTO') {

        } else if (children.length > 0) {
          content += '<ul>';
          content += printProp(children, depth + 1);
          content += '</ul>';
        } else if (item.text() !== '') {
          content += jsxc.escapeHTML(item.text());
        }

        content += '</li>';

        if (depth === 0 && $('#jsxc_dialog ul.jsxc_vCard').length > 0) {
          if ($('#jsxc_dialog ul.jsxc_vCard li.jsxc_sep:first').length > 0) {
            $('#jsxc_dialog ul.jsxc_vCard li.jsxc_sep:first').before(content);
          } else {
            $('#jsxc_dialog ul.jsxc_vCard').append(content);
          }
          content = '';
        }
      });

      if (depth > 0) {
        return content;
      }
    };

    var failedToLoad = function() {
      if ($('#jsxc_dialog ul.jsxc_vCard').length === 0) {
        return;
      }

      $('#jsxc_dialog p').remove();

      var content = '<p>';
      content += jsxc.t('Sorry_your_buddy_doesnt_provide_any_information');
      content += '</p>';

      $('#jsxc_dialog').append(content);
    };

    jsxc.xmpp.loadVcard(bid, function(stanza) {

      if ($('#jsxc_dialog ul.jsxc_vCard').length === 0) {
        return;
      }

      $('#jsxc_dialog p').remove();

      var photo = $(stanza).find("vCard > PHOTO");

      if (photo.length > 0) {
        var img = photo.find('BINVAL').text();
        var type = photo.find('TYPE').text();
        var src = 'data:' + type + ';base64,' + img;

        if (photo.find('EXTVAL').length > 0) {
          src = photo.find('EXTVAL').text();
        }

        // concat chunks
        src = src.replace(/[\t\r\n\f]/gi, '');

        var img_el = $('<img class="jsxc_vCard" alt="avatar" />');
        img_el.attr('src', src);

        $('#jsxc_dialog h3').before(img_el);
      }

      if ($(stanza).find('vCard').length === 0 ||
          ($(stanza).find('vcard > *').length === 1 && photo.length === 1)) {
        failedToLoad();
        return;
      }

      printProp($(stanza).find('vcard > *'), 0);

    }, failedToLoad);
  },

  /**
   Open a dialog box with misc settings.

   */
  showSettings : function() {

    jsxc.gui.dialog.open(jsxc.gui.template.get('settings'));

    if (jsxc.options.get('xmpp').overwrite === 'false' ||
        jsxc.options.get('xmpp').overwrite === false) {
      $('.jsxc_fieldsetXmpp').parent().hide();
    }

    $('#jsxc_dialog form').each(function() {
      var self = $(this);

      self.find('input[type!="submit"]').each(function() {
        var id = this.id.split("-");
        var prop = id[0];
        var key = id[1];
        var type = this.type;

        var data = jsxc.options.get(prop);

        if (data && typeof data[key] !== 'undefined') {
          if (type === 'checkbox') {
            if (data[key] !== 'false' && data[key] !== false) {
              this.checked = 'checked';
            }
          } else {
            $(this).val(data[key]);
          }
        }
      });
    });

    $('#jsxc_dialog form').submit(function() {

      var self = $(this);
      var data = {};

      self.find('input[type!="submit"]').each(function() {
        var id = this.id.split("-");
        var prop = id[0];
        var key = id[1];
        var val;
        var type = this.type;

        if (type === 'checkbox') {
          val = this.checked;
        } else {
          val = $(this).val();
        }

        if (!data[prop]) {
          data[prop] = {};
        }

        data[prop][key] = val;
      });

      $.each(data, function(key, val) {
        jsxc.options.set(key, val);
      });

      var cb = function(success) {
        if (typeof self.attr('data-onsubmit') === 'string') {
          jsxc.exec(self.attr('data-onsubmit'), [success]);
        }

        setTimeout(function() {
          if (success) {
            self.find('button[type="submit"]').switchClass('btn-primary', 'btn-success');
          } else {
            self.find('button[type="submit"]').switchClass('btn-primary', 'btn-danger');
          }
          setTimeout(function() {
            self.find('button[type="submit"]').switchClass('btn-danger btn-success', 'btn-primary');
          }, 2000);
        }, 200);
      };

      jsxc.options.saveSettinsPermanent.call(this, data, cb);

      return false;
    });
  },

  /**
   * Show prompt for notification permission.
   *
   * @memberOf jsxc.gui
   */
  showRequestNotification : function() {

    jsxc.switchEvents({
      'notificationready.jsxc' : function() {
        jsxc.gui.dialog.close();
        jsxc.notification.init();
        jsxc.storage.setUserItem('notification', 1);
      }, 'notificationfailure.jsxc' : function() {
        jsxc.gui.dialog.close();
        jsxc.options.notification = false;
        jsxc.storage.setUserItem('notification', 0);
      }
    });

    jsxc.gui.showConfirmDialog(jsxc.t('Should_we_notify_you_'), function() {
      jsxc.gui.dialog.open(jsxc.gui.template.get('pleaseAccept'), {
        noClose : true
      });

      jsxc.notification.requestPermission();
    }, function() {
      $(document).trigger('notificationfailure.jsxc');
    });
  },

  showUnknownSender : function(bid) {
    var confirmationText = jsxc.t('You_received_a_message_from_an_unknown_sender_', {
      sender : bid
    });
    jsxc.gui.showConfirmDialog(confirmationText, function() {

      jsxc.gui.dialog.close();

      jsxc.storage.saveBuddy(bid, {
        jid : bid, name : bid, status : 0, sub : 'none', res : []
      });

      jsxc.gui.window.open(bid);

    }, function() {
      // reset state
      jsxc.storage.removeUserItem('chat', bid);
    });
  },

  showSelectionDialog : function(header, msg, primary, option, primaryLabel, optionLabel) {
    var opt;

    if (arguments.length === 1 && typeof header === 'object' && header !== null) {
      opt = header;
    } else {
      opt = {
        header : header, msg : msg, primary : {
          label : primaryLabel, cb : primary
        }, option : {
          label : optionLabel, cb : option
        }
      };
    }

    var dialog = jsxc.gui.dialog.open(jsxc.gui.template.get('selectionDialog'), {
      noClose : true
    });

    if (opt.header) {
      dialog.find('h3').text(opt.header);
    } else {
      dialog.find('h3').hide();
    }

    if (opt.msg) {
      dialog.find('p').text(opt.msg);
    } else {
      dialog.find('p').hide();
    }

    if (opt.primary && opt.primary.label) {
      dialog.find('.btn-primary').text(opt.primary.label);
    }

    if (opt.primary && opt.option.label) {
      dialog.find('.btn-default').text(opt.option.label);
    }

    if (opt.primary && opt.primary.cb) {
      dialog.find('.btn-primary').click(opt.primary.cb);
    }

    if (opt.primary && opt.option.cb) {
      dialog.find('.btn-primary').click(opt.option.cb);
    }
  },

  /**
   * Update all presence objects for given user.
   *
   * @memberOf jsxc.gui
   * @param bid bar jid of user.
   * @param {CONST.STATUS} pres New presence state.
   */
  updatePresence : function(bid, pres) {

    if (bid === 'own') {
      if (pres === 'dnd') {
        $('#jsxc_menu .jsxc_muteNotification').addClass('jsxc_disabled');
        jsxc.notification.muteSound(true);
      } else {
        $('#jsxc_menu .jsxc_muteNotification').removeClass('jsxc_disabled');

        if (!jsxc.options.get('muteNotification')) {
          jsxc.notification.unmuteSound(true);
        }
      }
    }

    $('[data-bid="' + bid + '"]').each(function() {
      var el = $(this);

      el.attr('data-status', pres);

      if (el.find('.jsxc_avatar').length > 0) {
        el = el.find('.jsxc_avatar');
      }

      el.removeClass('jsxc_' + jsxc.CONST.STATUS.join(' jsxc_')).addClass('jsxc_' + pres);
    });
  },

  /**
   * Switch read state to UNread and increase counter.
   *
   * @memberOf jsxc.gui
   * @param bid
   */
  unreadMsg : function(bid) {
    var winData = jsxc.storage.getUserItem('window', bid) || {};
    var count = (winData && winData.unread) || 0;
    count = (count === true) ? 1 : count + 1; //unread was boolean (<2.1.0)

    // update user counter
    winData.unread = count;
    jsxc.storage.setUserItem('window', bid, winData);

    // update counter of total unread messages
    var total = jsxc.storage.getUserItem('unreadMsg') || 0;
    total++;
    jsxc.storage.setUserItem('unreadMsg', total);

    if (jsxc.gui.favicon) {
      jsxc.gui.favicon.badge(total);
    }

    jsxc.gui._unreadMsg(bid, count);
  },

  /**
   * Switch read state to UNread.
   *
   * @memberOf jsxc.gui
   * @param bid
   * @param count
   */
  _unreadMsg : function(bid, count) {
    var win = jsxc.gui.window.get(bid);

    if (typeof count !== 'number') {
      // get counter after page reload
      var winData = jsxc.storage.getUserItem('window', bid);
      count = (winData && winData.unread) || 1;
      count = (count === true) ? 1 : count; //unread was boolean (<2.1.0)
    }

    var el = jsxc.gui.roster.getItem(bid).add(win);

    el.addClass('jsxc_unreadMsg');
    el.find('.jsxc_unread').text(count);
  },

  /**
   * Switch read state to read.
   *
   * @memberOf jsxc.gui
   * @param bid
   */
  readMsg : function(bid) {
    var win = jsxc.gui.window.get(bid);
    var winData = jsxc.storage.getUserItem('window', bid);
    var count = (winData && winData.unread) || 0;
    count = (count === true) ? 0 : count; //unread was boolean (<2.1.0)

    var el = jsxc.gui.roster.getItem(bid).add(win);
    el.removeClass('jsxc_unreadMsg');
    el.find('.jsxc_unread').text(0);

    // update counters if not called from other tab
    if (count > 0) {
      // update counter of total unread messages
      var total = jsxc.storage.getUserItem('unreadMsg') || 0;
      total -= count;
      jsxc.storage.setUserItem('unreadMsg', total);

      if (jsxc.gui.favicon) {
        jsxc.gui.favicon.badge(total);
      }

      jsxc.storage.updateUserItem('window', bid, 'unread', 0);
    }
  },

  /**
   * This function searches for URI scheme according to XEP-0147.
   *
   * @memberOf jsxc.gui
   * @param container In which element should we search?
   */
  detectUriScheme : function(container) {
    container = (container) ? $(container) : $('body');

    container.find("a[href^='xmpp:']").each(function() {

      var element = $(this);
      var href = element.attr('href').replace(/^xmpp:/, '');
      var jid = href.split('?')[0];
      var action, params = {};

      if (href.indexOf('?') < 0) {
        action = 'message';
      } else {
        var pairs = href.substring(href.indexOf('?') + 1).split(';');
        action = pairs[0];

        var i, key, value;
        for (i = 1; i < pairs.length; i++) {
          key = pairs[i].split('=')[0];
          value =
              (pairs[i].indexOf('=') > 0) ? pairs[i].substring(pairs[i].indexOf('=') + 1) : null;

          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }

      if (typeof jsxc.gui.queryActions[action] === 'function') {
        element.addClass('jsxc_uriScheme jsxc_uriScheme_' + action);

        element.off('click').click(function(ev) {
          ev.stopPropagation();

          jsxc.gui.queryActions[action].call(jsxc, jid, params);

          return false;
        });
      }
    });
  },

  detectEmail : function(container) {
    container = (container) ? $(container) : $('body');

    container.find('a[href^="mailto:"],a[href^="xmpp:"]').each(function() {
      var spot = $("<span>X</span>").addClass("jsxc_spot");
      var href = $(this).attr("href").replace(/^ *(mailto|xmpp):/, "").trim();

      if (href !== '' && href !== Strophe.getBareJidFromJid(jsxc.storage.getItem("jid"))) {
        var bid = jsxc.jidToBid(href);
        var self = $(this);
        var s = self.prev();

        if (!s.hasClass('jsxc_spot')) {
          s = spot.clone().attr('data-bid', bid);

          self.before(s);
        }

        s.off('click');

        if (jsxc.storage.getUserItem('buddy', bid)) {
          jsxc.gui.update(bid);
          s.click(function() {
            jsxc.gui.window.open(bid);

            return false;
          });
        } else {
          s.click(function() {
            jsxc.gui.showContactDialog(href);

            return false;
          });
        }
      }
    });
  },

  avatarPlaceholder : function(el, seed, text) {
    text = text || seed;

    var options = jsxc.options.get('avatarplaceholder') || {};
    var hash = jsxc.hashStr(seed);

    var hue = Math.abs(hash) % 360;
    var saturation = options.saturation || 90;
    var lightness = options.lightness || 65;

    el.css({
      'background-color' : 'hsl(' + hue + ', ' + saturation + '%, ' + lightness + '%)',
      'color' : '#fff',
      'font-weight' : 'bold',
      'text-align' : 'center',
      'line-height' : el.height() + 'px',
      'font-size' : el.height() * 0.6 + 'px'
    });

    if (typeof text === 'string' && text.length > 0) {
      el.text(text[0].toUpperCase());
    }
  },

  /**
   * Replace shortname emoticons with images.
   *
   * @param  {string} str text with emoticons as shortname
   * @return {string} text with emoticons as images
   */
  shortnameToImage : function(str) {
    str = str.replace(jsxc.gui.regShortNames, function(shortname) {
      if (typeof shortname === 'undefined' || shortname === '' ||
          (!(shortname in jsxc.gui.emoticonList.emojione) &&
          !(shortname in jsxc.gui.emoticonList.core))) {
        return shortname;
      }

      var src, filename;

      if (jsxc.gui.emoticonList.core[shortname]) {
        filename =
            jsxc.gui.emoticonList.core[shortname][jsxc.gui.emoticonList.core[shortname].length -
            1].replace(/^:([^:]+):$/, '$1');
        src = jsxc.options.root + '/img/emotions/' + filename + '.svg';
      } else if (jsxc.gui.emoticonList.emojione[shortname]) {
        filename =
            jsxc.gui.emoticonList.emojione[shortname][jsxc.gui.emoticonList.emojione[shortname].length -
            1];
        src = jsxc.options.root + '/lib/emojione/assets/svg/' + filename + '.svg';
      }

      var div = $('<div>');

      div.addClass('jsxc_emoticon');
      div.css('background-image', 'url(' + src + ')');
      div.attr('title', shortname);

      return div.prop('outerHTML');
    });

    return str;
  }
};

/**
 * Wrapper for dialog
 *
 * @namespace jsxc.gui.dialog
 */
jsxc.gui.dialog = {
  /**
   * Open a Dialog.
   *
   * @memberOf jsxc.gui.dialog
   * @param {String} data Data of the dialog
   * @param {Object} [o] Options for the dialog
   * @param {Boolean} [o.noClose] If true, hide all default close options
   * @returns {jQuery} Dialog object
   */
  open : function(data, o) {

    var opt = $.extend({
      name : ''
    }, o);

    $.magnificPopup.open({
      items : {
        src : '<div data-name="' + opt.name + '" id="jsxc_dialog">' + data + '</div>'
      }, type : 'inline', modal : opt.noClose, callbacks : {
        beforeClose : function() {
          $(document).trigger('cleanup.dialog.jsxc');
        }, afterClose : function() {
          $(document).trigger('close.dialog.jsxc');
        }, open : function() {
          $('#jsxc_dialog .jsxc_close').click(function(ev) {
            ev.preventDefault();

            jsxc.gui.dialog.close();
          });

          $('#jsxc_dialog form').each(function() {
            var form = $(this);

            form.find('button[data-jsxc-loading-text]').each(function() {
              var btn = $(this);

              btn.on('btnloading.jsxc', function() {
                if (!btn.prop('disabled')) {
                  btn.prop('disabled', true);

                  btn.data('jsxc_value', btn.text());

                  btn.text(btn.attr('data-jsxc-loading-text'));
                }
              });

              btn.on('btnfinished.jsxc', function() {
                if (btn.prop('disabled')) {
                  btn.prop('disabled', false);

                  btn.text(btn.data('jsxc_value'));
                }
              });
            });
          });

          jsxc.gui.dialog.resize();

          $(document).trigger('complete.dialog.jsxc');
        }
      }
    });

    return $('#jsxc_dialog');
  },

  /**
   * If no name is provided every dialog will be closed,
   * otherwise only dialog with given name is closed.
   *
   * @param {string} [name] Close only dialog with the given name
   */
  close : function(name) {
    jsxc.debug('close dialog');

    if (typeof name === 'string' && name.length > 0 &&
        !jsxc.el_exists('#jsxc_dialog[data-name=' + name + ']')) {
      return;
    }

    $.magnificPopup.close();
  },

  /**
   * Resizes current dialog.
   *
   * @param {Object} options e.g. width and height
   */
  resize : function() {

  }
};

