
jsxc.gui.actions = {

  init: function() {
    
    // Start a new MUC conversation
    $('#jsxc-chat-sidebar .jsxc-action_new-conversation').click(function(){

      var self = jsxc.gui.actions;
      
      var selected = [];
      $.each(self._getCheckedBuddies(), function(index, element){
          selected.push(element.jid);
      });
      
      jsxc.api.createNewConversationWith(selected);
    });

    // TODO delete MUC or user
    //
    // if (data.type !== 'groupchat') {
    //   bud.find('.jsxc_delete').click(function() {
    //     jsxc.gui.showRemoveDialog(bid);
    //     return false;
    //   });
    // }


  },

  _getCheckedBuddies: function(){

    var all = $("#jsxc_buddylist li");
    var rslt = [];

    all.each(function(){
      var element = $(this);
      if(element.find(".jsxc-checked").length > 0){
        rslt.push({
          jid: element.data('jid'),
          bid: element.data('bid')
        });
      }
    });

    return rslt;

  }
  
};