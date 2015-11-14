var _ = require('underscore');

/**
 * Plugin that is responsible for taking incoming 'raw' events and emitting
 * them based on their command name so that listeners that need to only listen
 * for a single command type are easier to implement.
 */
module.exports = function(client, IBF) {

   client.on('raw', function(data) {
      if (!_.isEmpty(data.command) && _.isString(data.command)) {
         client.emit('raw#' + data.command, data);
      }
   });

};
