var _ = require('underscore'),
    Q = require('q'),
    Pluggable = require('./Pluggable'),
    irc = require('irc'),
    EventEmitter = require('events').EventEmitter,
    MIRRORED_EVENTS, MIRRORED_FUNCTIONS, DEFAULT_CONFIG, DEFAULT_CONN_CONFIG, MANDATORY_CONN_CONFIG,
    Client;

MIRRORED_EVENTS = [
   'raw',
   'nick',
   'join',
   'error',
];

MIRRORED_FUNCTIONS = [
   'say',
   'join',
   'send',
   'action',
   'notice',
];

DEFAULT_CONFIG = {
   nicknames: [ 'ircbot' ]
};

DEFAULT_CONN_CONFIG = {
   showErrors: true,
   autoRejoin: true,

   userName: 'irc-bot-framework',
   realName: 'IRC Bot Framework'
};

MANDATORY_CONN_CONFIG = {
   autoConnect: true
};

Client = Pluggable.extend({

   init: function(userConfig) {
      var config = _.extend({}, DEFAULT_CONFIG, userConfig),
          conn = _.extend({}, DEFAULT_CONN_CONFIG, userConfig.connection, MANDATORY_CONN_CONFIG),
          nick = _.first(config.nicknames) || _.first(DEFAULT_CONFIG.nicknames);

      this._config = config;
      this._config.connection = conn;
      this._client = new irc.Client(conn.server, nick, conn);

      this.use(require('../plugins/core/rawMessageEmitter'));
      this.use(require('../plugins/core/nickAndJoin'));
      this.use(require('../plugins/core/messageMediator'));

      this._mirrorEvents();
      this._mirrorFunctions();
   },

   nick: function() {
      return this._client.nick;
   },

   inRoom: function(room) {
      var def = Q.defer(),
          timeoutID;

      this._logger.trace('querying for users in room "%s"', room);

      this._client.once('names' + room, function(users) {
         users = _.keys(users);
         this._logger.trace('users in "%s":', room, users.join(', '));
         def.resolve(users);
         clearTimeout(timeoutID);
      }.bind(this));

      // if we have not fulfilled the promise in ten seconds, give up
      timeoutID = setTimeout(function() {
         if (!def.promise.isFulfilled()) {
            this._logger.trace('waited too long for response for users in "%s"', room);
            def.reject('timeout exceeded');
         }
      }.bind(this), 10000);

      this._client.send('names', room);

      return def.promise;
   },

   _mirrorEvents: function() {
      _.each(MIRRORED_EVENTS, function(evt) {
         this._client.on(evt, function() {
            var args = [ evt ].concat(Array.prototype.slice.call(arguments));
            this.emit.apply(this, args);
         }.bind(this));
      }.bind(this));
   },

   _mirrorFunctions: function() {
      _.each(MIRRORED_FUNCTIONS, function(fn) {
         this[fn] = function() {
            this._client[fn].apply(this._client, Array.prototype.slice.call(arguments));
         }.bind(this);
      }.bind(this));
   },

});

_.extend(Client.prototype, EventEmitter.prototype);

module.exports = Client;
