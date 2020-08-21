const mqtt = require('mqtt');

var platform;
var client;
var config = {host: "", port: 0, credentials: false, channel: ""};

module.exports = {
  Mqtt: Mqtt
};

function Mqtt(aPlatform, host, port, channel, credentials) {
  platform = aPlatform;

  config = {host: host, port: port, credentials: credentials, channel: channel};
  if (typeof config.credentials === 'undefined' || typeof config.credentials.username === 'undefined' || config.credentials.username.length == 0) {
    config.credentials = false;
  }
  this.connect();
}

Mqtt.prototype.connect = function() {
    var connectOptions = {
    host: config.host,
    port: config.port
  };

  if (config.credentials)
  {
    connectOptions.username = config.credentials.username;
    connectOptions.password = config.credentials.password;
  }

  client = mqtt.connect(connectOptions);

  client.on('connect', function() {
    platform.log("Successfully connected to MQTT broker.");
    client.subscribe(config.channel);
  });

  client.on('close', function(error) {
    client.end(true, function() {
      this.error("Retrying in 5 seconds...");
      setTimeout(function() {
        platform.log("Retrying connection to MQTT broker...");
        this.connect();
      }.bind(this), 5000);
    }.bind(this));

  }.bind(this));

  client.on('error', function(error) {
    client.end(true, function() {
      this.error(error);
    }.bind(this));
  }.bind(this));

  client.on('message', function (topic, buffer) {
    var message;
    try {
        message = JSON.parse(buffer.toString());
    } catch (e) {
        if (e instanceof SyntaxError) {
            platform.log('[ERR] JSON Syntax Error - misconstructed MQTT message received');
            platform.log(e);
            platform.log('[ERR] The offending message follows:');
            platform.log(buffer.toString());
        } else {
            platform.log(e);
            platform.log('[ERR] The offending message follows:');
            platform.log(buffer.toString());
        }
        message = !1;
    }
    if (message !== !1) {
        if (typeof message.nvalue !== 'undefined' || typeof message.svalue1 !== 'undefined') {
          var accessory = platform.accessories.find(function(acc) {
            return acc.idx == message.idx;
          });

          if (!accessory) {
            return;
          }

          accessory.handleMQTTMessage(message, function(characteristic, value) {
            if (typeof value !== 'undefined' && typeof characteristic !== 'undefined') {
              characteristic.setValue(value, null, "eDomoticz-MQTT");
            }
          });
        } else {
            platform.log('[ERR] MQTT message received, but no nvalue or svalue1 was found:');
            platform.log(message);
        }
    }
  });
};

Mqtt.prototype.send = function(message) {
  if (client)
  {
    var payload = message;
    if (typeof payload !== 'string') {
      payload = JSON.stringify(payload);
    }
    client.publish('domoticz/in', payload);
  }
};

Mqtt.prototype.error = function(error) {
  var logMessage = "Could not connect to MQTT broker! (" + config.host + ":" + config.port + ")\n";

  if (config.credentials !== false) {
    logMessage += "Note: You're using a username and password to connect. Please verify your username and password too.\n";
  }

  if (error) {
    logMessage += error;
  }

  platform.log(logMessage);
};