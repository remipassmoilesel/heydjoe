
    join: function (room, nick, msg_handler_cb, pres_handler_cb, roster_cb, password, history_attrs, extended_presence) {

    leave: function (room, nick, handler_cb, exit_msg) {

    message: function (room, nick, message, html_message, type) {
    
    groupchat: function (room, message, html_message) {
    
    invite: function (room, receiver, reason) {
    
    queryOccupants: function (room, success_cb, error_cb) {
    
    configure: function (room, handler_cb, error_cb) {
    
    cancelConfigure: function (room) {
    
    saveConfiguration: function (room, config, success_cb, error_cb) {
    
    createInstantRoom: function (room, success_cb, error_cb) {
    
    setTopic: function (room, topic) {
    
    modifyRole: function (room, nick, role, reason, handler_cb, error_cb) {
        
    modifyAffiliation: function (room, jid, affiliation, reason, handler_cb, error_cb) {
    
    ban: function (room, jid, reason, handler_cb, error_cb) {
    
    member: function (room, jid, reason, handler_cb, error_cb) {
    
    revoke: function (room, jid, reason, handler_cb, error_cb) {
    
    owner: function (room, jid, reason, handler_cb, error_cb) {
    
    admin: function (room, jid, reason, handler_cb, error_cb) {
    
    changeNick: function (room, user) {
    
    setStatus: function (room, user, show, status) {
    
    listRooms: function (server, handle_cb, error_cb) {
    
    
    
    