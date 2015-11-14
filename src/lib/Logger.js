var _ = require('underscore'),
    moment = require('moment'),
    util = require('util'),
    Class = require('class.extend'),
    LOG_LEVELS = [ 'trace', 'debug', 'info', 'warn', 'error' ],
    DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS',
    Logger;

Logger = Class.extend({

   format: function() {
      return DEFAULT_FORMAT;
   },

   _date: function() {
      return moment().format(this.format());
   },

   _log: function(level) {
      var args = Array.prototype.slice.call(arguments, 1),
          msg = util.format.apply(util, args);

      console.log('%s [%s]: %s', this._date(), level, msg);
   },

});

_.each(LOG_LEVELS, function(lvl) {
   var LVL = lvl.toUpperCase();
   Logger.prototype[lvl] = function() {
      this._log.apply(this, [ LVL ].concat(Array.prototype.slice.call(arguments)));
   };
});

module.exports = Logger;
