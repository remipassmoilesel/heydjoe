

jsxc.gui.template['aboutDialog'] = '<h3>JavaScript XMPP Chat</h3>\n' +
'<p>\n' +
'   <b>Version: </b>{{version}}\n' +
'   <br /> <a href="http://jsxc.org/" target="_blank">www.jsxc.org</a>\n' +
'</p>\n' +
'<p>\n' +
'   <i>Released under the MIT license</i>\n' +
'</p>\n' +
'<p>\n' +
'   Real-time chat app for {{app_name}} and more.\n' +
'   <br /> Requires an external <a href="https://xmpp.org/xmpp-software/servers/" target="_blank">XMPP server</a>.\n' +
'</p>\n' +
'<p class="jsxc_credits">\n' +
'   <b>Credits: </b> <a href="http://www.beepzoid.com/old-phones/" target="_blank">David English (Ringtone)</a>,\n' +
'   <a href="https://soundcloud.com/freefilmandgamemusic/ping-1?in=freefilmandgamemusic/sets/free-notification-sounds-and" target="_blank">CameronMusic (Ping)</a>,\n' +
'   <a href="http://www.picol.org/">Picol (Fullscreen icon)</a>, <a href="http://www.jabber.org/">Jabber Software Foundation (Jabber lightbulb logo)</a>\n' +
'</p>\n' +
'<p class="jsxc_libraries">\n' +
'   <b>Libraries: </b>\n' +
'   <$ dep.libraries $>\n' +
'</p>\n' +
'\n' +
'<button class="btn btn-default pull-right jsxc_debuglog">Show debug log</button>\n' +
'';

jsxc.gui.template['alert'] = '<h3 data-i18n="Alert"></h3>\n' +
'<div class="alert alert-info">\n' +
'   <strong data-i18n="Info"></strong> {{msg}}\n' +
'</div>\n' +
'';

jsxc.gui.template['allowMediaAccess'] = '<p data-i18n="Please_allow_access_to_microphone_and_camera"></p>\n' +
'';

jsxc.gui.template['approveDialog'] = '<h3 data-i18n="Subscription_request"></h3>\n' +
'<p>\n' +
'   <span data-i18n="You_have_a_request_from"></span> <b class="jsxc_their_jid"></b>.\n' +
'</p>\n' +
'\n' +
'<button class="btn btn-primary jsxc_approve pull-right" data-i18n="Approve"></button>\n' +
'<button class="btn btn-default jsxc_deny pull-right" data-i18n="Deny"></button>\n' +
'';

jsxc.gui.template['authFailDialog'] = '<h3 data-i18n="Login_failed"></h3>\n' +
'<p data-i18n="Sorry_we_cant_authentikate_"></p>\n' +
'\n' +
'<button class="btn btn-primary jsxc_retry pull-right" data-i18n="Continue_without_chat"></button>\n' +
'<button class="btn btn-default jsxc_cancel pull-right" data-i18n="Retry"></button>\n' +
'';

jsxc.gui.template['authenticationDialog'] = '<h3>Verification</h3>\n' +
'<p data-i18n="Authenticating_a_buddy_helps_"></p>\n' +
'<div>\n' +
'   <p data-i18n="[html]How_do_you_want_to_authenticate_your_buddy"></p>\n' +
'\n' +
'   <div class="btn-group" role="group">\n' +
'      <button class="btn btn-default" data-i18n="Manual"></button>\n' +
'      <button class="btn btn-default" data-i18n="Question"></button>\n' +
'      <button class="btn btn-default" data-i18n="Secret"></button>\n' +
'   </div>\n' +
'</div>\n' +
'<hr />\n' +
'<div style="display: none">\n' +
'   <p data-i18n="To_verify_the_fingerprint_" class="jsxc_explanation"></p>\n' +
'   <p>\n' +
'      <strong data-i18n="Your_fingerprint"></strong>\n' +
'      <br /> <span style="text-transform: uppercase">{{my_priv_fingerprint}}</span>\n' +
'   </p>\n' +
'   <p>\n' +
'      <strong data-i18n="Buddy_fingerprint"></strong>\n' +
'      <br /> <span style="text-transform: uppercase">{{bid_priv_fingerprint}}</span>\n' +
'   </p>\n' +
'   <div class="jsxc_right">\n' +
'      <button class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
'      <button class="btn btn-primary jsxc_submit" data-i18n="Compared"></button>\n' +
'   </div>\n' +
'</div>\n' +
'<div style="display: none" class="form-horizontal">\n' +
'   <p data-i18n="To_authenticate_using_a_question_" class="jsxc_explanation"></p>\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_quest" data-i18n="Question"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="quest" id="jsxc_quest" class="form-control" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_secret2" data-i18n="Secret"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="secret2" id="jsxc_secret2" class="form-control" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <div class="col-sm-offset-4 col-sm-8">\n' +
'         <button class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
'         <button class="btn btn-primary jsxc_submit" data-i18n="Ask"></button>\n' +
'      </div>\n' +
'   </div>\n' +
'</div>\n' +
'<div style="display: none" class="form-horizontal">\n' +
'   <p class="jsxc_explanation" data-i18n="To_authenticate_pick_a_secret_"></p>\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_secret" data-i18n="Secret"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="secret" id="jsxc_secret" class="form-control" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <div class="col-sm-offset-4 col-sm-8">\n' +
'         <button class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
'         <button class="btn btn-primary jsxc_submit" data-i18n="Compare"></button>\n' +
'      </div>\n' +
'   </div>\n' +
'</div>\n' +
'';

jsxc.gui.template['bookmarkDialog'] = '<h3 data-i18n="Edit_bookmark"></h3>\n' +
'<form class="form-horizontal">\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_room" data-i18n="Room"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" id="jsxc_room" class="form-control" required="required" readonly="readonly" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_nickname" data-i18n="Nickname"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" disabled="disabled" required="required" name="nickname" id="jsxc_nickname" class="form-control" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <div class="col-sm-offset-4 col-sm-8">\n' +
'         <div class="checkbox">\n' +
'            <label>\n' +
'               <input id="jsxc_bookmark" type="checkbox"><span data-i18n="Bookmark"></span>\n' +
'            </label>\n' +
'         </div>\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <div class="col-sm-offset-4 col-sm-8">\n' +
'         <div class="checkbox disabled">\n' +
'            <label>\n' +
'               <input disabled="disabled" id="jsxc_autojoin" type="checkbox"><span data-i18n="Auto-join"></span>\n' +
'            </label>\n' +
'         </div>\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <div class="col-sm-offset-4 col-sm-8">\n' +
'         <button type="button" class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
'         <button type="submit" class="btn btn-primary jsxc_submit" data-i18n="Save"></button>\n' +
'      </div>\n' +
'   </div>\n' +
'</form>\n' +
'';

jsxc.gui.template['chatWindow'] = '<li class="jsxc_windowItem">\n' +
'   <div class="jsxc_window">\n' +
'      <div class="jsxc_bar">\n' +
'         <div class="jsxc_avatar"></div>\n' +
'         <div class="jsxc_tools">\n' +
'            <div class="jsxc_settings">\n' +
'               <div class="jsxc_more"></div>\n' +
'               <div class="jsxc_inner jsxc_menu">\n' +
'                  <ul>\n' +
'                     <li>\n' +
'                        <a class="jsxc_verification" href="#">\n' +
'                           <span data-i18n="Authentication"></span>\n' +
'                        </a>\n' +
'                     </li>\n' +
'                     <li>\n' +
'                        <a class="jsxc_clear" href="#">\n' +
'                           <span data-i18n="clear_history"></span>\n' +
'                        </a>\n' +
'                     </li>\n' +
'                     <li>\n' +
'                        <a class="jsxc_sendFile" href="#">\n' +
'                           <span data-i18n="Send_file"></span>\n' +
'                        </a>\n' +
'                     </li>\n' +
'                  </ul>\n' +
'               </div>\n' +
'            </div>\n' +
'            <div class="jsxc_close">×</div>\n' +
'         </div>\n' +
'         <div class="jsxc_caption">\n' +
'            <div class="jsxc_name" />\n' +
'            <div class="jsxc_lastmsg">\n' +
'               <span class="jsxc_unread" />\n' +
'               <span class="jsxc_text" />\n' +
'            </div>\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="jsxc_fade">\n' +
'         <div class="jsxc_overlay">\n' +
'            <div>\n' +
'               <div class="jsxc_body" />\n' +
'               <div class="jsxc_close" />\n' +
'            </div>\n' +
'         </div>\n' +
'         <div class="jsxc_textarea" />\n' +
'         <div class="jsxc_emoticons">\n' +
'            <div class="jsxc_inner">\n' +
'               <ul>\n' +
'                  <li style="clear:both"></li>\n' +
'               </ul>\n' +
'            </div>\n' +
'         </div>\n' +
'         <div class="jsxc_transfer jsxc_otr jsxc_disabled" />\n' +
'         <input type="text" class="jsxc_textinput" data-i18n="[placeholder]Message" />\n' +
'      </div>\n' +
'   </div>\n' +
'</li>\n' +
'';

jsxc.gui.template['confirmDialog'] = '<p>{{msg}}</p>\n' +
'\n' +
'<button class="btn btn-primary jsxc_confirm pull-right" data-i18n="Confirm"></button>\n' +
'<button class="btn btn-default jsxc_dismiss jsxc_close pull-right" data-i18n="Dismiss"></button>\n' +
'';

jsxc.gui.template['contactDialog'] = '<h3 data-i18n="Add_buddy"></h3>\n' +
'<p class=".jsxc_explanation" data-i18n="Type_in_the_full_username_"></p>\n' +
'<form class="form-horizontal">\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_username" data-i18n="Username"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="username" id="jsxc_username" class="form-control" list="jsxc_userlist" pattern="^[^\\x22&\'\\\\/:<>@\\s]+(@[.\\-_\\w]+)?" required="required" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <datalist id="jsxc_userlist"></datalist>\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_alias" data-i18n="Alias"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="alias" id="jsxc_alias" class="form-control" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <div class="col-sm-offset-4 col-sm-8">\n' +
'         <button class="btn btn-default jsxc_close" type="button" data-i18n="Close"></button>\n' +
'         <button class="btn btn-primary" type="submit" data-i18n="Add"></button>\n' +
'      </div>\n' +
'   </div>\n' +
'</form>\n' +
'';

jsxc.gui.template['fingerprintsDialog'] = '<div>\n' +
'   <p class="jsxc_maxWidth" data-i18n="A_fingerprint_"></p>\n' +
'   <p>\n' +
'      <strong data-i18n="Your_fingerprint"></strong>\n' +
'      <br /> <span style="text-transform: uppercase">{{my_priv_fingerprint}}</span>\n' +
'   </p>\n' +
'   <p>\n' +
'      <strong data-i18n="Buddy_fingerprint"></strong>\n' +
'      <br /> <span style="text-transform: uppercase">{{bid_priv_fingerprint}}</span>\n' +
'   </p>\n' +
'</div>\n' +
'';

jsxc.gui.template['incomingCall'] = '<h3 data-i18n="Incoming_call"></h3>\n' +
'<p>\n' +
'   <span data-i18n="Do_you_want_to_accept_the_call_from"></span> {{bid_name}}?\n' +
'</p>\n' +
'\n' +
'<button class="btn btn-primary jsxc_accept pull-right" data-i18n="Accept"></button>\n' +
'<button class="btn btn-default jsxc_reject pull-right" data-i18n="Reject"></button>\n' +
'';

jsxc.gui.template['joinChat'] = '<h3 data-i18n="Join_chat"></h3>\n' +
'<p class=".jsxc_explanation" data-i18n="muc_explanation"></p>\n' +
'<div class="form-horizontal">\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_server" data-i18n="Server"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="server" id="jsxc_server" class="form-control" required="required" readonly="readonly" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_room" data-i18n="Room"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="room" id="jsxc_room" class="form-control" autocomplete="off" list="jsxc_roomlist" required="required" pattern="^[^\\x22&\'\\/:<>@\\s]+" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <p class="jsxc_inputinfo jsxc_waiting jsxc_room" data-i18n="Rooms_are_loaded"></p>\n' +
'   <datalist id="jsxc_roomlist">\n' +
'      <p>\n' +
'         <label for="jsxc_roomlist_select"></label>\n' +
'         <select id="jsxc_roomlist_select">\n' +
'            <option></option>\n' +
'            <option>workaround</option>\n' +
'         </select>\n' +
'      </p>\n' +
'   </datalist>\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_nickname" data-i18n="Nickname"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="nickname" id="jsxc_nickname" class="form-control" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_password" data-i18n="Password"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="password" id="jsxc_password" class="form-control" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group jsxc_bookmark">\n' +
'      <div class="col-sm-offset-4 col-sm-8">\n' +
'         <div class="checkbox">\n' +
'            <label>\n' +
'               <input id="jsxc_bookmark" type="checkbox"><span data-i18n="Bookmark"></span>\n' +
'            </label>\n' +
'         </div>\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group jsxc_bookmark">\n' +
'      <div class="col-sm-offset-4 col-sm-8">\n' +
'         <div class="checkbox disabled">\n' +
'            <label>\n' +
'               <input disabled="disabled" id="jsxc_autojoin" type="checkbox"><span data-i18n="Auto-join"></span>\n' +
'            </label>\n' +
'         </div>\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="jsxc_msg"></div>\n' +
'   <div class="form-group">\n' +
'      <div class="col-sm-offset-4 col-sm-8">\n' +
'         <span class="jsxc_warning"></span>\n' +
'         <button class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
'         <button class="btn btn-primary jsxc_continue" data-i18n="Continue"></button>\n' +
'         <button class="btn btn-success jsxc_join" data-i18n="Join"></button>\n' +
'      </div>\n' +
'   </div>\n' +
'</div>\n' +
'';

jsxc.gui.template['loginBox'] = '<h3 data-i18n="Login"></h3>\n' +
'<form class="form-horizontal">\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_username" data-i18n="Username"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="text" name="username" id="jsxc_username" class="form-control" required="required" value="{{my_node}}" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="form-group">\n' +
'      <label class="col-sm-4 control-label" for="jsxc_password" data-i18n="Password"></label>\n' +
'      <div class="col-sm-8">\n' +
'         <input type="password" name="password" required="required" class="form-control" id="jsxc_password" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="jsxc_alert jsxc_alert-warning" data-i18n="Sorry_we_cant_authentikate_"></div>\n' +
'   <div class="form-group">\n' +
'      <div class="col-sm-offset-4 col-sm-9">\n' +
'         <button type="reset" class="btn btn-default jsxc_close" name="clear" data-i18n="Cancel" />\n' +
'         <button type="submit" class="btn btn-primary" name="commit" data-i18n="[data-jsxc-loading-text]Connecting...;Connect" />\n' +
'      </div>\n' +
'   </div>\n' +
'</form>\n' +
'';

jsxc.gui.template['menuContacts'] = '<div id="jsxc_menuContacts">\n' +
'\n' +
'    Utilisateurs disponibles:\n' +
'\n' +
'    <div id="jsxc_contactsUserList"></div>\n' +
'\n' +
'    <div class="jsxc_addBuddyFromList jsxc_actionButton">Inviter un utilisateur</div>\n' +
'\n' +
'    <div class="jsxc_removeBuddyFromList jsxc_actionButton">Supprimer un contact</div>\n' +
'\n' +
'    <div class="jsxc_refreshBuddyList jsxc_actionButton">Rafraichir la liste</div>\n' +
'\n' +
'</div>';

jsxc.gui.template['menuRooms'] = '<div id="jsxc_menuRooms">\n' +
'\n' +
'    Liste des salons disponibles:\n' +
'    <div id="jsxc_availablesRooms"></div>\n' +
'\n' +
'    <div class="jsxc_joinRoom jsxc_actionButton">Rejoindre un salon</div>\n' +
'\n' +
'    <div class="jsxc_refreshRoomList jsxc_actionButton">Rafraichir la liste</div>\n' +
'\n' +
'    <div class="jsxc_actionButton notImplementedYet">Informations sur le salon</div>\n' +
'\n' +
'    <div class="jsxc_deleteRoom jsxc_actionButton notImplementedYet">Supprimer un salon</div>\n' +
'\n' +
'    <div class="jsxc_sideMenuCreateRoomForm">\n' +
'\n' +
'        <input type="text" class="jsxc_inputChatRoomName" placeholder="Nom du salon"/>\n' +
'\n' +
'        <input type="text" class="jsxc_inputChatRoomSubject" placeholder="Sujet"/>\n' +
'\n' +
'        <br/>\n' +
'        <input type="checkbox" id="jsxc_roomCreationPrivate" value="0" class="notImplementedYet"/>Salon privé\n' +
'\n' +
'        <br/>\n' +
'        <input type="checkbox" id="jsxc_roomCreationEphemeral" value="0" class="notImplementedYet"/>Salon éphémère\n' +
'\n' +
'    </div>\n' +
'\n' +
'    <div class="jsxc_createRoom jsxc_actionButton">Créer un salon</div>\n' +
'\n' +
'    <p>&nbsp;</p>\n' +
'\n' +
'    <div class="jsxc_roomDialog jsxc_actionButton" >Boite de dialogue "salons"</div>\n' +
'\n' +
'</div>';

jsxc.gui.template['menuSettings'] = '<div id="jsxc_menuSettings">\n' +
'\n' +
'    <div class="jsxc_actionButton jsxc_muteNotification" data-i18n="Mute"></div>\n' +
'\n' +
'    <div class="jsxc_actionButton notImplementedYet">Activer les notifications de bureau</div>\n' +
'\n' +
'    <div class="jsxc_actionButton notImplementedYet">Interdire les appels vidéos</div>\n' +
'\n' +
'    <div class="jsxc_actionButton jsxc_hideOffline" data-i18n="Hide_offline"></div>\n' +
'\n' +
'    <div class="jsxc_actionButton jsxc_dialog_settings">Boite de dialogue de réglages</div>\n' +
'\n' +
'    <div class="jsxc_actionButton notImplementedYet">Rétablir les réglages par défaut</div>\n' +
'\n' +
'    <div class="jsxc_actionButton notImplementedYet">Console XMPP</div>\n' +
'\n' +
'    <div class="jsxc_actionButton notImplementedYet">Console d\'événements Jquery</div>\n' +
'\n' +
'    <div class="jsxc_actionButton jsxc_about">A propos</div>\n' +
'\n' +
'</div>\n' +
'';

jsxc.gui.template['menuTools'] = '<div>\n' +
'\n' +
'    <div class="jsxc_actionButton notImplementedYet">Ouvrir un pad</div>\n' +
'\n' +
'    <div class="jsxc_actionButton notImplementedYet">Créer un pad</div>\n' +
'\n' +
'    <div class="jsxc_actionButton notImplementedYet">Liste des pads</div>\n' +
'\n' +
'</div>';

jsxc.gui.template['menuWelcome'] = '<div id="jsxc_menuWelcome">\n' +
'\n' +
'    <p>\n' +
'        Recherchez une fonctionnalité à l\'aide du champs ci-dessus ou explorez le menu :)\n' +
'    </p>\n' +
'\n' +
'    <div data-pres="offline" class="jsxc_actionButton jsxc_menu_offline">Se déconnecter</div>\n' +
'\n' +
'    <!-- Display notifications -->\n' +
'\n' +
'    <div id="jsxc_notice">\n' +
'        <div>\n' +
'            Notifications: <span class="jsxc_menu_notif_number"></span>\n' +
'        </div>\n' +
'\n' +
'        <!-- Notification inserted here -->\n' +
'        <ul>\n' +
'\n' +
'        </ul>\n' +
'\n' +
'    </div>\n' +
'\n' +
'    <p>Statut:</p>\n' +
'\n' +
'    <div class="jsxc_status_buttons">\n' +
'\n' +
'        <div data-pres="online" class="jsxc_actionButton jsxc_online" data-i18n="Online"></div>\n' +
'        <div data-pres="chat" class="jsxc_actionButton jsxc_chat" data-i18n="Chatty"></div>\n' +
'        <div data-pres="away" class="jsxc_actionButton jsxc_away" data-i18n="Away"></div>\n' +
'        <div data-pres="xa" class="jsxc_actionButton jsxc_xa" data-i18n="Extended_away"></div>\n' +
'        <div data-pres="dnd" class="jsxc_actionButton jsxc_dnd" data-i18n="dnd"></div>\n' +
'\n' +
'    </div>\n' +
'\n' +
'</div>';

jsxc.gui.template['pleaseAccept'] = '<p data-i18n="Please_accept_"></p>\n' +
'';

jsxc.gui.template['removeDialog'] = '<h3 data-i18n="Remove_buddy"></h3>\n' +
'<p class="jsxc_maxWidth" data-i18n="[html]You_are_about_to_remove_"></p>\n' +
'\n' +
'<button class="btn btn-primary jsxc_remove pull-right" data-i18n="Remove"></button>\n' +
'<button class="btn btn-default jsxc_cancel jsxc_close pull-right" data-i18n="Cancel"></button>\n' +
'';

jsxc.gui.template['roster'] = '<!-- Side bar with buddy list and menu -->\n' +
'<div id="jsxc_roster">\n' +
'\n' +
'    <!-- Main menu -->\n' +
'    <div id="jsxc_side_menu">\n' +
'\n' +
'        <div id="jsxc_side_menu_search_bar">\n' +
'\n' +
'            <input type="text" placeholder="Rechercher" id="jsxc_menu_search_text_field"/>\n' +
'            <input type="button" id="jsxc_menu_previous_btn" value="<"/>\n' +
'            <input type="button" id="jsxc_menu_next_btn" value=">"/>\n' +
'\n' +
'            <div id="jsxc_menu_feedback">&nbsp;</div>\n' +
'\n' +
'        </div>\n' +
'\n' +
'        <div id="jsxc_side_menu_content"></div>\n' +
'\n' +
'    </div>\n' +
'\n' +
'    <!-- buddy list -->\n' +
'    <ul id="jsxc_buddylist"></ul>\n' +
'\n' +
'    <!-- Menu bar on bottom of roster -->\n' +
'    <div class="jsxc_bottom jsxc_presence jsxc_rosteritem" data-bid="own">\n' +
'\n' +
'        <!-- Avatar -->\n' +
'        <div id="jsxc_avatar" class="jsxc_avatar"/>\n' +
'\n' +
'        <div id="jsxc_menu">\n' +
'\n' +
'            <!-- Button for menu openning, image added with scss/_jsxc.scss -->\n' +
'            <span></span>\n' +
'\n' +
'        </div>\n' +
'\n' +
'        <div class="jsxc_menu_notif_bottom_roster"><span class="jsxc_menu_notif_number"></span></div>\n' +
'\n' +
'        <div id="jsxc_presence">\n' +
'            <span data-i18n="Offline">Offline</span>\n' +
'            <div class="jsxc_inner">\n' +
'                <ul>\n' +
'                    <li data-pres="online" class="jsxc_online" data-i18n="Online"></li>\n' +
'                    <li data-pres="chat" class="jsxc_chat" data-i18n="Chatty"></li>\n' +
'                    <li data-pres="away" class="jsxc_away" data-i18n="Away"></li>\n' +
'                    <li data-pres="xa" class="jsxc_xa" data-i18n="Extended_away"></li>\n' +
'                    <li data-pres="dnd" class="jsxc_dnd" data-i18n="dnd"></li>\n' +
'                    <li data-pres="offline" class="jsxc_offline" data-i18n="Offline"></li>\n' +
'                </ul>\n' +
'            </div>\n' +
'        </div>\n' +
'\n' +
'    </div>\n' +
'\n' +
'    <!-- Barre transparente permettant de replier le menu JSXC -->\n' +
'    <div id="jsxc_toggleRoster"></div>\n' +
'\n' +
'</div>\n' +
'';

jsxc.gui.template['rosterBuddy'] = '<li class="jsxc_rosteritem">\n' +
'   <div class="jsxc_avatar"></div>\n' +
'   <div class="jsxc_more" />\n' +
'   <div class="jsxc_caption">\n' +
'      <div class="jsxc_name" />\n' +
'      <div class="jsxc_lastmsg">\n' +
'         <span class="jsxc_unread" />\n' +
'         <span class="jsxc_text" />\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="jsxc_menu">\n' +
'      <ul>\n' +
'         <li><a class="jsxc_rename" href="#"><span class="jsxc_icon jsxc_editicon"></span><span data-i18n="rename_buddy"></span></a></li>\n' +
'         <li><a class="jsxc_vcard" href=""><span class="jsxc_icon jsxc_infoicon"></span><span data-i18n="get_info"></span></a></li>\n' +
'         <li><a class="jsxc_delete" href=""><span class="jsxc_icon jsxc_deleteicon"></span><span data-i18n="delete_buddy"></span></a></li>\n' +
'      </ul>\n' +
'   </div>\n' +
'</li>\n' +
'';

jsxc.gui.template['rosterMenu'] = '<!-- en cours -->\n' +
'<h3>Section 1</h3>\n' +
'<div>\n' +
'    <p>\n' +
'        Mauris mauris ante, blandit et, ultrices a, suscipit eget, quam. Integer\n' +
'        ut neque. Vivamus nisi metus, molestie vel, gravida in, condimentum sit\n' +
'        amet, nunc. Nam a nibh. Donec suscipit eros. Nam mi. Proin viverra leo ut\n' +
'        odio. Curabitur malesuada. Vestibulum a velit eu ante scelerisque vulputate.\n' +
'    </p>\n' +
'</div>\n' +
'<h3>Section 2</h3>\n' +
'<div>\n' +
'    <p>\n' +
'        Sed non urna. Donec et ante. Phasellus eu ligula. Vestibulum sit amet\n' +
'        purus. Vivamus hendrerit, dolor at aliquet laoreet, mauris turpis porttitor\n' +
'        velit, faucibus interdum tellus libero ac justo. Vivamus non quam. In\n' +
'        suscipit faucibus urna.\n' +
'    </p>\n' +
'</div>\n' +
'<h3>Section 3</h3>\n' +
'<div>\n' +
'    <p>\n' +
'        Nam enim risus, molestie et, porta ac, aliquam ac, risus. Quisque lobortis.\n' +
'        Phasellus pellentesque purus in massa. Aenean in pede. Phasellus ac libero\n' +
'        ac tellus pellentesque semper. Sed ac felis. Sed commodo, magna quis\n' +
'        lacinia ornare, quam ante aliquam nisi, eu iaculis leo purus venenatis dui.\n' +
'    </p>\n' +
'    <ul>\n' +
'        <li>List item one</li>\n' +
'        <li>List item two</li>\n' +
'        <li>List item three</li>\n' +
'    </ul>\n' +
'</div>\n' +
'<h3>Section 4</h3>\n' +
'<div>\n' +
'    <p>\n' +
'        Cras dictum. Pellentesque habitant morbi tristique senectus et netus\n' +
'        et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in\n' +
'        faucibus orci luctus et ultrices posuere cubilia Curae; Aenean lacinia\n' +
'        mauris vel est.\n' +
'    </p>\n' +
'    <p>\n' +
'        Suspendisse eu nisl. Nullam ut libero. Integer dignissim consequat lectus.\n' +
'        Class aptent taciti sociosqu ad litora torquent per conubia nostra, per\n' +
'        inceptos himenaeos.\n' +
'    </p>\n' +
'</div>\n' +
'</div>\n' +
'';

jsxc.gui.template['selectionDialog'] = '<h3></h3>\n' +
'<p></p>\n' +
'\n' +
'<button class="btn btn-primary pull-right" data-i18n="Confirm"></button>\n' +
'<button class="btn btn-default pull-right" data-i18n="Dismiss"></button>\n' +
'';

jsxc.gui.template['settings'] = '<form class="form-horizontal col-sm-6">\n' +
'   <fieldset class="jsxc_fieldsetXmpp jsxc_fieldset">\n' +
'      <h3 data-i18n="Login_options"></h3>\n' +
'      <p data-i18n="setting-explanation-xmpp"></p>\n' +
'      <div class="form-group">\n' +
'         <label class="col-sm-6 control-label" for="xmpp-url" data-i18n="BOSH_url"></label>\n' +
'         <div class="col-sm-6">\n' +
'            <input type="text" id="xmpp-url" class="form-control" readonly="readonly" />\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <label class="col-sm-6 control-label" for="xmpp-username" data-i18n="Username"></label>\n' +
'         <div class="col-sm-6">\n' +
'            <input type="text" id="xmpp-username" class="form-control" />\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <label class="col-sm-6 control-label" for="xmpp-domain" data-i18n="Domain"></label>\n' +
'         <div class="col-sm-6">\n' +
'            <input type="text" id="xmpp-domain" class="form-control" />\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <label class="col-sm-6 control-label" for="xmpp-resource" data-i18n="Resource"></label>\n' +
'         <div class="col-sm-6">\n' +
'            <input class="form-control" type="text" id="xmpp-resource" class="form-control" />\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <div class="col-sm-offset-6 col-sm-6">\n' +
'            <button class="btn btn-primary jsxc_continue" type="submit" data-i18n="Save"></button>\n' +
'         </div>\n' +
'      </div>\n' +
'   </fieldset>\n' +
'</form>\n' +
'\n' +
'<form class="form-horizontal col-sm-6">\n' +
'   <fieldset class="jsxc_fieldsetPriority jsxc_fieldset">\n' +
'      <h3 data-i18n="Priority"></h3>\n' +
'      <p data-i18n="setting-explanation-priority"></p>\n' +
'      <div class="form-group">\n' +
'         <label class="col-sm-6 control-label" for="priority-online" data-i18n="Online"></label>\n' +
'         <div class="col-sm-6">\n' +
'            <input type="number" value="0" id="priority-online" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <label class="col-sm-6 control-label" for="priority-chat" data-i18n="Chatty"></label>\n' +
'         <div class="col-sm-6">\n' +
'            <input type="number" value="0" id="priority-chat" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <label class="col-sm-6 control-label" for="priority-away" data-i18n="Away"></label>\n' +
'         <div class="col-sm-6">\n' +
'            <input type="number" value="0" id="priority-away" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <label class="col-sm-6 control-label" for="priority-xa" data-i18n="Extended_away"></label>\n' +
'         <div class="col-sm-6">\n' +
'            <input type="number" value="0" id="priority-xa" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <label class="col-sm-6 control-label" for="priority-dnd" data-i18n="dnd"></label>\n' +
'         <div class="col-sm-6">\n' +
'            <input type="number" value="0" id="priority-dnd" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <div class="col-sm-offset-6 col-sm-6">\n' +
'            <button class="btn btn-primary jsxc_continue" type="submit" data-i18n="Save"></button>\n' +
'         </div>\n' +
'      </div>\n' +
'   </fieldset>\n' +
'</form>\n' +
'\n' +
'<form class="form-horizontal col-sm-6">\n' +
'   <fieldset class="jsxc_fieldsetLoginForm jsxc_fieldset">\n' +
'      <h3 data-i18n="On_login"></h3>\n' +
'      <p data-i18n="setting-explanation-login"></p>\n' +
'      <div class="form-group">\n' +
'         <div class="col-sm-12">\n' +
'            <div class="checkbox">\n' +
'               <label>\n' +
'                  <input type="checkbox" id="loginForm-enable"><span data-i18n="On_login"></span>\n' +
'               </label>\n' +
'            </div>\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <div class="col-sm-12">\n' +
'            <button class="btn btn-primary jsxc_continue" type="submit" data-i18n="Save"></button>\n' +
'         </div>\n' +
'      </div>\n' +
'   </fieldset>\n' +
'</form>\n' +
'\n' +
'<form class="form-horizontal col-sm-6" data-onsubmit="xmpp.carbons.refresh">\n' +
'   <fieldset class="jsxc_fieldsetCarbons jsxc_fieldset">\n' +
'      <h3 data-i18n="Carbon_copy"></h3>\n' +
'      <p data-i18n="setting-explanation-carbon"></p>\n' +
'      <div class="form-group">\n' +
'         <div class="col-sm-12">\n' +
'            <div class="checkbox">\n' +
'               <label>\n' +
'                  <input type="checkbox" id="carbons-enable"><span data-i18n="Enable"></span>\n' +
'               </label>\n' +
'            </div>\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'         <div class="col-sm-12">\n' +
'            <button class="btn btn-primary jsxc_continue" type="submit" data-i18n="Save"></button>\n' +
'         </div>\n' +
'      </div>\n' +
'   </fieldset>\n' +
'</form>\n' +
'';

jsxc.gui.template['vCard'] = '<h3>\n' +
'	<span data-i18n="Info_about"></span> <span>{{bid_name}}</span>\n' +
'</h3>\n' +
'<ul class="jsxc_vCard"></ul>\n' +
'<p>\n' +
'   <img src="{{root}}/img/loading.gif" alt="wait" width="32px" height="32px" /> <span data-i18n="Please_wait"></span>...\n' +
'</p>\n' +
'';

jsxc.gui.template['videoWindow'] = '<div id="jsxc_webrtc">\n' +
'   <div class="jsxc_chatarea">\n' +
'      <ul></ul>\n' +
'   </div>\n' +
'   <div class="jsxc_videoContainer">\n' +
'      <video class="jsxc_localvideo" autoplay></video>\n' +
'      <video class="jsxc_remotevideo" autoplay></video>\n' +
'      <div class="jsxc_status"></div>\n' +
'      <div class="bubblingG">\n' +
'         <span id="bubblingG_1"> </span> <span id="bubblingG_2"> </span> <span id="bubblingG_3"> </span>\n' +
'      </div>\n' +
'      <div class="jsxc_noRemoteVideo">\n' +
'         <div>\n' +
'            <div></div>\n' +
'            <p data-i18n="No_video_signal"></p>\n' +
'            <div></div>\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="jsxc_controlbar jsxc_visible">\n' +
'         <div>\n' +
'            <div class="jsxc_hangUp jsxc_videoControl" />\n' +
'            <div class="jsxc_fullscreen jsxc_videoControl" />\n' +
'         </div>\n' +
'      </div>\n' +
'   </div>\n' +
'   <div class="jsxc_multi">\n' +
'      <div class="jsxc_snapshotbar">\n' +
'         <p>No pictures yet!</p>\n' +
'      </div>\n' +
'      <!--<div class="jsxc_chatarea">\n' +
'                   <ul></ul>\n' +
'               </div>-->\n' +
'      <div class="jsxc_infobar"></div>\n' +
'   </div>\n' +
'</div>\n' +
'';

jsxc.gui.template['waitAlert'] = '<h3>{{msg}}</h3>\n' +
'\n' +
'<div class="progress">\n' +
'   <div class="progress-bar progress-bar-striped active" style="width: 100%" data-i18n="Please_wait">\n' +
'   </div>\n' +
'</div>\n' +
'';

jsxc.gui.template['windowList'] = '<div id="jsxc_windowList">\n' +
'   <ul></ul>\n' +
'</div>\n' +
'<div id="jsxc_windowListSB">\n' +
'   <div class="jsxc_scrollLeft jsxc_disabled">&lt;</div>\n' +
'   <div class="jsxc_scrollRight jsxc_disabled">&gt;</div>\n' +
'</div>\n' +
'';
