/**
 * Etherpad integration
 * @type {{openpad: jsxc.etherpad.openpad}}
 */

jsxc.etherpad = {

  /**
   * Return true if Etherpad is enabled
   * @returns {boolean}
   */
  isEtherpadEnabled : function() {
    var opts = jsxc.options.get("etherpad");
    return opts.enabled === true;
  },

  getEtherpadLinkFor : function(padId) {
    var opts = jsxc.options.get("etherpad");
    return opts.ressource + 'p/' + padId +
        '?showControls=true&showChat=false&showLineNumbers=true&useMonospaceFont=true';
  },

  /**
   * Open a new pad in a window
   * @param bid
   */
  openpad : function(padId) {

    jsxc.stats.addEvent('jsxc.etherpad.opened');

    if (jsxc.etherpad.isEtherpadEnabled() === false) {
      jsxc.warn('Etherpad not enabled');
      jsxc.gui.feedback("Etherpad n'est pas activé.");
      return;
    }

    // embedable code of pad
    var embedCode = '<iframe name="embed_readwrite" src="' +
        jsxc.etherpad.getEtherpadLinkFor(padId) + '" style="width: 100%; height: 100%"></iframe>';        // container for pad
    var dialogId = "jsxc_pad_" + padId;
    var dialog = $("<div></div>").attr('id', dialogId);
    dialog.append(embedCode);

    // add and show dialog
    $("body").append(dialog);

    dialog.dialog({
      height : 400, width : 600
    });

  }

};