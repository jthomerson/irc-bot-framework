var _ = require('underscore'),
    Class = require('class.extend'),
    irc = require('irc'),
    EventEmitter = require('events').EventEmitter,
    MIRRORED_EVENTS, MIRRORED_FUNCTIONS, DEFAULT_CONFIG, DEFAULT_CONN_CONFIG, MANDATORY_CONN_CONFIG,
    Client;

MIRRORED_EVENTS = [
   'nick',
   'join',
   'error',
];

MIRRORED_FUNCTIONS = [
   'say',
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

Client = Class.extend({

   _nickIndex: 0,

   init: function(userConfig) {
      var config = _.extend({}, DEFAULT_CONFIG, userConfig),
          conn = _.extend({}, DEFAULT_CONN_CONFIG, userConfig.connection, MANDATORY_CONN_CONFIG),
          nick = _.first(config.nicknames) || _.first(DEFAULT_CONFIG.nicknames);

      this._config = config;
      this._config.connection = conn;
      this._client = new irc.Client(conn.server, nick, conn);

      // handle nick registration and room joining:
      this._listenForNickRejections();
      this._waitToJoin();

      this._listenForMessages();
      this._mirrorEvents();
      this._mirrorFunctions();
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

   _listenForNickRejections: function() {
      this._client.on('raw', function(data) {
         if (data.command === 'err_nicknameinuse') {
            this._nickIndex++;
            if (this._config.nicknames.length > this._nickIndex) {
               this._client.send('nick', this._config.nicknames[this._nickIndex]);
            }
         }
      }.bind(this));
   },

   _waitToJoin: function() {
      var isValidNick = _.contains(this._config.nicknames, this._client.nick),
          hasNicksLeft = (this._config.nicknames.length > this._nickIndex),
          channels = this._config.channels.join(' ');

      if (!isValidNick && hasNicksLeft) {
         // will still be trying, so don't join yet
         return setTimeout(this._waitToJoin.bind(this), 100);
      }

      this._client.join(channels);
   },

   _listenForMessages: function() {
      this._client.on('message', function(sender, channel, msg, data) {
         var ind = msg.indexOf(this._client.nick),
             isPrivateChannel = (channel === this._client.nick),
             responseChannel = (isPrivateChannel ? sender : channel);

         if (ind === 0 || isPrivateChannel) {
            this.emit('directmessage', sender, responseChannel, msg, data);
         } else if (ind !== -1) {
            this.emit('mention', sender, responseChannel, msg, data);
         }
      }.bind(this));
   },

});

_.extend(Client.prototype, EventEmitter.prototype);

module.exports = Client;
