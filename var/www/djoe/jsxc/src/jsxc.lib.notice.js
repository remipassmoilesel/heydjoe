/**
 * This namespace handle the notice system.
 *
 * @namspace jsxc.notice
 * @memberOf jsxc
 */
jsxc.notice = {
  /** Number of notices. */
  _num : 0,

  /**
   * Loads the saved notices.
   *
   * @memberOf jsxc.notice
   */
  load : function() {

    var self = this;

    // reset list
    $('#jsxc_notice ul li').remove();

    $('#jsxc_roster .jsxc_menu_notif_number').text('');
    jsxc.notice._num = 0;

    var saved = jsxc.storage.getUserItem('notices') || [];
    var key = null;

    // console.log(jsxc.storage.getUserItem('notices'));

    for (key in saved) {
      if (saved.hasOwnProperty(key)) {
        var val = saved[key];

        jsxc.notice.add(val.msg, val.description, val.fnName, val.fnParams, key);
      }
    }

    self._showNoNoticeContent();
  },

  _showNoNoticeContent : function() {
    if ($('#jsxc_notice ul li').length < 1) {
      $('#jsxc_notice ul').append("<li class='jsxc_noNotice'>Aucune notification</li>");
    }

    else {
      $('#jsxc_notice .jsxc_noNotice').remove();
    }
  },

  /**
   * Add a new notice to the stack;
   *
   * @memberOf jsxc.notice
   * @param msg Header message
   * @param description Notice description
   * @param fnName Function name to be called if you open the notice
   * @param fnParams Array of params for function
   * @param id Notice id
   */
  add : function(msg, description, fnName, fnParams, id) {

    var self = this;

    var nid = id || Date.now();
    var list = $('#jsxc_notice ul');
    var notice = $('<li/>');

    notice.click(function() {
      jsxc.notice.remove(nid);

      jsxc.exec(fnName, fnParams);

      return false;
    });

    notice.text(msg + " " + description);
    notice.attr('title', description || '');
    notice.attr('data-nid', nid);
    list.append(notice);

    $('#jsxc_roster .jsxc_menu_notif_number').text(++jsxc.notice._num);

    if (!id) {
      var saved = jsxc.storage.getUserItem('notices') || {};
      saved[nid] = {
        msg : msg, description : description, fnName : fnName, fnParams : fnParams
      };

      jsxc.storage.setUserItem('notices', saved);

      jsxc.notification.notify(msg, description || '', null, true, jsxc.CONST.SOUNDS.NOTICE);
    }

    self._showNoNoticeContent();
  },

  /**
   * Removes notice from stack
   *
   * @memberOf jsxc.notice
   * @param nid The notice id
   */
  remove : function(nid) {

    var self = this;

    var el = $('#jsxc_notice li[data-nid=' + nid + ']');

    el.remove();
    $('#jsxc_roster .jsxc_menu_notif_number').text(--jsxc.notice._num || '');

    var s = jsxc.storage.getUserItem('notices');
    delete s[nid];
    jsxc.storage.setUserItem('notices', s);

    self._showNoNoticeContent();
  },

  /**
   * Check if there is already a notice for the given function name.
   *
   * @memberOf jsxc.notice
   * @param {string} fnName Function name
   * @returns {boolean} True if there is >0 functions with the given name
   */
  has : function(fnName) {
    var saved = jsxc.storage.getUserItem('notices') || [];
    var has = false;

    $.each(saved, function(index, val) {
      if (val.fnName === fnName) {
        has = true;

        return false;
      }
    });

    return has;
  }
};
