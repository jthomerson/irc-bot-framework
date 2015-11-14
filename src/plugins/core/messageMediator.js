/**
 * Plugin that is responsible for listening to incoming IRC messages on all
 * channels, parsing them and emitting events based on the type of message and
 * its contents.
 *
 * NOTE: this plugin is internal and thus makes use of internal functions and
 * variables that external plugins should not use.
 */
module.exports = function(client, IBF) {

   client._client.on('message', function(sender, channel, msg, data) {
      var ind = msg.indexOf(client.nick()),
          isPrivateChannel = (channel === client.nick()),
          responseChannel = (isPrivateChannel ? sender : channel);

      IBF.logger.trace('received message from "%s" on "%s" saying "%s"', sender, channel, msg);

      if (ind === 0 || isPrivateChannel) {
         client.emit('directmessage', sender, responseChannel, msg, data);
      } else if (ind !== -1) {
         client.emit('mention', sender, responseChannel, msg, data);
      }
   });

};
