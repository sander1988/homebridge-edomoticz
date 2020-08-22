const mqtt = require('mqtt');
const EventEmitter = require('events');
const Helper = require('./helper').Helper;

var client;
var config = {host: "", port: 0, credentials: false, channel: ""};

module.exports = {
  Mqtt: Mqtt
};

function Mqtt(log) {
    EventEmitter.call(this);

    if (log) {
        this.log = log;
    } else {
        this.log = function () {}
    }
}

Mqtt.prototype.connect = function (host, port, channel, credentials) {
    config = {host: host, port: port, credentials: credentials, channel: channel};
    if (typeof config.credentials === 'undefined' || typeof config.credentials.username === 'undefined' || config.credentials.username.length == 0) {
        config.credentials = false;
    }
    this.reconnect();
};

Mqtt.prototype.reconnect = function () {
    var connectOptions = {
        host: config.host,
        port: config.port
    };

    if (config.credentials) {
        connectOptions.username = config.credentials.username;
        connectOptions.password = config.credentials.password;
    }

    client = mqtt.connect(connectOptions);

    client.on('connect', function () {
        this.log("Successfully connected to MQTT broker.");
        client.subscribe(config.channel);
    }.bind(this));

    client.on('close', function (error) {
        client.end(true, function () {
            this.error("Retrying in 5 seconds...");
            setTimeout(function () {
                this.log("Retrying connection to MQTT broker...");
                this.reconnect();
            }.bind(this), 5000);
        }.bind(this));
    }.bind(this));

    client.on('error', function (error) {
        client.end(true, function () {
            this.error(error);
        }.bind(this));
    }.bind(this));

    client.on('message', function (topic, buffer) {
        var message;
        try {
            message = JSON.parse(buffer.toString());
        } catch (e) {
            if (e instanceof SyntaxError) {
                this.log('[ERR] JSON Syntax Error - misconstructed MQTT message received');
                this.log(e);
                this.log('[ERR] The offending message follows:');
                this.log(buffer.toString());
            } else {
                this.log(e);
                this.log('[ERR] The offending message follows:');
                this.log(buffer.toString());
            }
            message = false;
        }
        if (message !== false) {
            if (typeof message.nvalue !== 'undefined' || typeof message.svalue1 !== 'undefined') {
                this.emit('message', message)
            } else {
                this.log('[ERR] MQTT message received, but no nvalue or svalue1 was found:');
                this.log(message);
            }
        }
    }.bind(this));
};

Mqtt.prototype.send = function (message) {
    if (client) {
        var payload = message;
        if (typeof payload !== 'string') {
            payload = JSON.stringify(payload);
        }
        client.publish('domoticz/in', payload);
    }
};

Mqtt.prototype.error = function (error) {
    var logMessage = "Could not connect to MQTT broker! (" + config.host + ":" + config.port + ")\n";

    if (config.credentials !== false) {
        logMessage += "Note: You're using a username and password to connect. Please verify your username and password too.\n";
    }

    if (error) {
        logMessage += error;
    }

    this.log(logMessage);
};

Helper.fixInheritance(Mqtt, EventEmitter);
