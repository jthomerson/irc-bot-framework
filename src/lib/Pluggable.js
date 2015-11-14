var _ = require('underscore'),
    Class = require('class.extend'),
    Pluggable;

Pluggable = Class.extend({

   use: function(plugin) {
      if (_.isFunction(plugin)) {
         return plugin(this, this.IBF);
      }
   }

});

module.exports = Pluggable;
