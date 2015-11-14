var Class = require('class.extend'),
    Client = require('./lib/Client'),
    Logger = require('./lib/Logger'),
    IBF = {},
    createInjector;

createInjector = function(withLogger) {

   withLogger = (withLogger === undefined ? false : withLogger);

   return {

      init: function() {
         this.IBF = IBF;
         if (withLogger) {
            this._logger = IBF.logger;
         }
         this._super && this._super.apply(this, arguments);
      },

   };

};

IBF.Client = Client.extend(createInjector(true));
IBF.Logger = Logger.extend(createInjector());
IBF.logger = new IBF.Logger();

module.exports = IBF;
