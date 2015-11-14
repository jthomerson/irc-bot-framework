var _ = require('underscore');

/**
 * Plugin that iterates through nicknames in the config in order to find one
 * not in use, and upon successfully becoming that nick, joins the channels
 * from the config.
 *
 * NOTE: this plugin is internal and thus makes use of internal functions and
 * variables that external plugins should not use.
 */
module.exports = function(client, IBF) {
   var index = 0;

   client.on('raw#err_nicknameinuse', function(data) {
      index++;
      IBF.logger.debug('nick in use:', data.args);
      if (client._config.nicknames.length > index) {
         IBF.logger.debug('trying nickname [%s]: "%s"', index, client._config.nicknames[index]);
         client.send('nick', client._config.nicknames[index]);
      }
   });

   function waitToJoin() {
      // TODO: make it so that we're not using a private field _config from the client
      var isValidNick = _.contains(client._config.nicknames, client.nick()),
          hasNicksLeft = (client._config.nicknames.length > index),
          channels = client._config.channels.join(' ');

      if (!isValidNick && hasNicksLeft) {
         // will still be trying, so don't join yet
         return setTimeout(waitToJoin, 100);
      }

      IBF.logger.debug('joining channels [%s] as "%s"', channels, client.nick());
      client.join(channels);
   }

   waitToJoin();

};
