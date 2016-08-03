
jsxc.gui.conversations = {

  init: function(){

    $('#jsxc_conversationlist').slimScroll({
      distance : '3px',
      height : ($('#jsxc_roster').height() - 31) / 2 + 'px',
      width : $('#jsxc_buddylist').width() + 'px',
      color : '#fff',
      opacity : '0.5'
    });

  }

};