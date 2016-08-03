
jsxc.gui.template = {};

/**
 * Return requested template and replace all placeholder
 *
 * @memberOf jsxc.gui.template;
 * @param {type} name template name
 * @param {type} bid
 * @param {type} msg
 * @returns {String} HTML Template
 */
jsxc.gui.template.get = function(name, bid, msg) {

  // common placeholder
  var ph = {
    my_priv_fingerprint : jsxc.storage.getUserItem('priv_fingerprint') ?
        jsxc.storage.getUserItem('priv_fingerprint').replace(/(.{8})/g, '$1 ') :
        jsxc.t('not_available'),
    my_jid : jsxc.storage.getItem('jid') || '',
    my_node : Strophe.getNodeFromJid(jsxc.storage.getItem('jid') || '') || '',
    root : jsxc.options.root,
    app_name : jsxc.options.app_name,
    version : jsxc.version
  };

  // placeholder depending on bid
  if (bid) {
    var data = jsxc.storage.getUserItem('buddy', bid);

    $.extend(ph, {
      bid_priv_fingerprint : (data && data.fingerprint) ?
          data.fingerprint.replace(/(.{8})/g, '$1 ') : jsxc.t('not_available'),
      bid_jid : bid,
      bid_name : (data && data.name) ? data.name : bid
    });
  }

  // placeholder depending on msg
  if (msg) {
    $.extend(ph, {
      msg : msg
    });
  }

  var ret = jsxc.gui.template[name];

  if (typeof(ret) === 'string') {
    // prevent 404
    ret = ret.replace(/\{\{root\}\}/g, ph.root);

    // convert to string

    // ret = $('<div>').append($(ret).i18n()).html();
    ret = $('<div>').append(jsxc.localization.processHtmlString(ret)).html();

    // replace placeholders
    ret = ret.replace(/\{\{([a-zA-Z0-9_\-]+)\}\}/g, function(s, key) {
      return (typeof ph[key] === 'string') ? ph[key] : s;
    });

    return ret;
  }

  jsxc.debug('Template not available: ' + name);
  return name;
};
