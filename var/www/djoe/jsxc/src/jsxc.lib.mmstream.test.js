/**
 * Test cases of multiple multimedia stream module
 *
 *
 * /!\ Be careful, here you can manipulate real data of JSXC client
 *
 * @type {{}}
 */

jsxc.mmstream.testCases = [

  {
    name : "Video participants selection",

    testCase : function(assert) {

      var self = jsxc.mmstream;

      var domain = "@domain.net";

      var nodes = ['a', 'b', 'c', 'd', 'f', 'g', 'h', 'i'];

      var participants = [];

      var initiator = "e" + domain;

      // create a fake list of participants
      $.each(nodes, function(index, node) {
        participants.push(node + domain);
      });

      var res = {};

      $.each(participants.concat([initiator]), function(index, part) {
        res[part] = self._whichUsersMustWeCall(initiator, participants, part);
      });

      var expected = '{"a@domain.net":["b@domain.net","c@domain.net","d@domain.net"],"b@domain.net":["c@domain.net","d@domain.net"],"c@domain.net":["d@domain.net"],"d@domain.net":[],"f@domain.net":["g@domain.net","h@domain.net","i@domain.net","a@domain.net","b@domain.net","c@domain.net","d@domain.net"],"g@domain.net":["h@domain.net","i@domain.net","a@domain.net","b@domain.net","c@domain.net","d@domain.net"],"h@domain.net":["i@domain.net","a@domain.net","b@domain.net","c@domain.net","d@domain.net"],"i@domain.net":["a@domain.net","b@domain.net","c@domain.net","d@domain.net"],"e@domain.net":["f@domain.net","g@domain.net","h@domain.net","i@domain.net","a@domain.net","b@domain.net","c@domain.net","d@domain.net"]}';

      assert.ok(expected === JSON.stringify(res), "Destinations selection ok");

    }
  },

  {
    name : "Utility methods for videoconference",

    testCase : function(assert) {

      var self = jsxc.mmstream;

      var user = "a@domain.net/heyhey";

      self._setUserStatus(user, self.USER_STATUS.AUTOACCEPT_STREAM);
      assert.ok(self._isBuddyAutoAccept(user) === true, "AUTOACCEPTED ok");
      assert.ok(self._isBuddyWaiting(user) !== true, "WAITING ok");

      self._setUserStatus(user, self.USER_STATUS.WAITING);
      assert.ok(self._isBuddyWaiting(user) === true, "WAITING ok");
      assert.ok(self._isBuddyAutoAccept(user) !== true, "AUTOACCEPTED ok");

      // delte user after, to not alter JSXC service
      delete self.videoconference.users[user];

    }
  }

];