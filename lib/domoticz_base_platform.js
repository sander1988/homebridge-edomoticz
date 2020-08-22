const util = require('util');
const Domoticz = require('./domoticz').Domoticz;
const Mqtt = require('./mqtt').Mqtt;
const Constants = require('./constants');
const Helper = require('./helper').Helper;

function eDomoticzBasePlatform(log, config, api) {
    this.isSynchronizingAccessories = false;
    this.accessories = [];
    this.log = function() {
        if (typeof process.env.DEBUG !== 'undefined') {
            log(util.format.apply(this, arguments));
        }
    };

    this.config = config;
    try {
        this.server = config.server;
        this.authorizationToken = false;
        if (this.server.indexOf(":") > -1 && this.server.indexOf("@") > -1) {
            var tmparr = this.server.split("@");
            this.authorizationToken = Helper.Base64.encode(tmparr[0]);
            this.server = tmparr[1];
        }

        this.ssl = (config.ssl == 1);
        this.port = config.port;
        this.room = config.roomid;
        this.api = api;
        this.apiBaseURL = "http" + (this.ssl ? "s" : "") + "://" + this.server + ":" + this.port + "/json.htm?";
        this.mqtt = false;
    } catch (e) {
        this.log(e);
        return;
    }
    var requestHeaders = {};
    if (this.authorizationToken) {
        requestHeaders['Authorization'] = 'Basic ' + this.authorizationToken;
    }
    Domoticz.initialize(this.ssl, requestHeaders);

    if (this.api) {
        this.api.once("didFinishLaunching", function() {
            var syncDevices = function() {
                this.synchronizeAccessories();
                setTimeout(syncDevices.bind(this), 600000); // Sync devices every 10 minutes
            }.bind(this);
            syncDevices();

            if (config.mqtt) {
                eDomoticzBasePlatform.setupMqttConnection(this);
            }
        }.bind(this));
    }
};

eDomoticzBasePlatform.prototype = {
    synchronizeAccessories: function() {
        if (this.isSynchronizingAccessories) {
            return;
        }

        this.isSynchronizingAccessories = true;
        this.log("Synchronize accessories in progress...");
        var excludedDevices = (typeof this.config.excludedDevices !== 'undefined') ? this.config.excludedDevices : [];

        Domoticz.devices(this.apiBaseURL, this.room, function(devices) {
            var removedAccessories = [];


            for (var i = 0; i < devices.length; i++) {
                var device = devices[i];
                if(!this.shouldProcessDevice(device)) {
                    continue;
                }

                var exclude = false;
                if (!(excludedDevices.indexOf(device.idx) <= -1)) {
                    exclude = true;
                    this.log(device.Name + " (IDX: " + device.idx + ") excluded via config array.");
                }

                if (device.Image == undefined) {
                    device.Image = 'Switch';
                }

                var existingAccessory = this.accessories.find(function(existingAccessory) {
                    return existingAccessory.idx == device.idx;
                });

                if (existingAccessory) {
                    if ((device.SwitchTypeVal > 0 && device.SwitchTypeVal !== existingAccessory.swTypeVal) || exclude) {
                        if (!exclude) {
                            this.log("Device " + existingAccessory.name + " has changed it's type. Recreating...");
                        } else {
                            this.log("Device " + existingAccessory.name + " has been excluded. Removing...");
                        }
                        removedAccessories.push(existingAccessory);
                        try {
                            this.api.unregisterPlatformAccessories("homebridge-edomoticz", "eDomoticz", [existingAccessory.platformAccessory]);
                        } catch (e) {
                            this.log("Could not unregister platform accessory! (" + existingAccessory.name + ")\n" + e);
                        }
                    } else {
                        continue;
                    }
                }

                if (!exclude) {
                    // Generate a new accessory
                    var uuid = UUID.generate(device.idx + "_" + device.Name);
                    this.log("Creating new device: " + device.Name + " (IDX: " + device.idx + ")");
                    var accessory = this.newAccessory(device, false, uuid, this.eve);
                    this.accessories.push(accessory);

                    // Register the accessories
                    this.publishAccessory(accessory);

                    // Store the accessory cache entries.
                    accessory.platformAccessory.context = {
                        device: device,
                        uuid: uuid,
                        eve: this.eve
                    };
                }
            }

            // Remove the old accessories
            for (var i = 0; i < this.accessories.length; i++) {
                var removedAccessory = this.accessories[i];
                var existingDevice = devices.find(function(existingDevice) {
                    return existingDevice.idx == removedAccessory.idx;
                });

                if (!existingDevice) {
                    removedAccessories.push(removedAccessory);
                    try {
                        this.api.unregisterPlatformAccessories("homebridge-edomoticz", "eDomoticz", [removedAccessory.platformAccessory]);
                    } catch (e) {
                        this.log("Could not unregister platform accessory! (" + removedAccessory.name + ")\n" + e);
                    }
                }
            }

            for (var i = 0; i < removedAccessories.length; i++) {
                this.removeAccessory(removedAccessories[i]);
            }

            this.isSynchronizingAccessories = false;
        }.bind(this), function(response, err) {
            Helper.LogConnectionError(this, response, err);
            this.isSynchronizingAccessories = false;
        }.bind(this));
    },
    configureAccessory: function(platformAccessory) {
        if (!platformAccessory.context || !platformAccessory.context.device) {
            // Remove this invalid device from the cache.
            try {
                this.api.unregisterPlatformAccessories("homebridge-edomoticz", "eDomoticz", [platformAccessory]);
            } catch (e) {
                this.log("Could not unregister cached platform accessory!\n" + e);
            }
            return;
        }

        var device = platformAccessory.context.device;
        var uuid = platformAccessory.context.uuid;
        var eve = platformAccessory.context.eve;

        this.log("Creating new device (from cache): " + device.Name + " (IDX: " + device.idx + ")");

        // Generate the already cached accessory again
        this.accessories.push(this.newAccessory(device, platformAccessory, uuid, eve));
    },
    newAccessory: function(device, platformAccessory, uuid, eve) {
        throw new Error("This (abstract) method should be overwritten by a subclass.");
    },
    removeAccessory: function(accessory) {
        var index = this.accessories.indexOf(accessory);
        this.accessories.splice(index, 1);
    },
    publishAccessory: function(accessory) {
        try {
            this.api.registerPlatformAccessories("homebridge-edomoticz", "eDomoticz", [accessory.platformAccessory]);
        } catch (e) {
            this.log("Could not register platform accessory! (" + accessory.name + ")\n" + e);
        }
    },
    shouldProcessDevice: function(device) {
        throw new Error("This (abstract) method should be overwritten by a subclass.");
    }
};

eDomoticzBasePlatform.setupMqttConnection = function(platform) { // Setup the static MQTT client (shared) instance.
    if(eDomoticzBasePlatform.mqtt) {
        platform.log("!!!!!! setupMqttConnection REUSE");
        platform.mqtt = eDomoticzBasePlatform.mqtt;
        return;
    }

    platform.log("!!!!!! setupMqttConnection NEW");

    var connectionInformation = {
        host: (typeof platform.config.mqtt.host !== 'undefined' ? platform.config.mqtt.host : '127.0.0.1'),
        port: (typeof platform.config.mqtt.port !== 'undefined' ? platform.config.mqtt.port : 1883),
        topic: (typeof platform.config.mqtt.topic !== 'undefined' ? platform.config.mqtt.topic : 'domoticz/out'),
        username: (typeof platform.config.mqtt.username !== 'undefined' ? platform.config.mqtt.username : ''),
        password: (typeof platform.config.mqtt.password !== 'undefined' ? platform.config.mqtt.password : ''),
    };

    var mqttError = function() {
        platform.log("There was an error while getting the MQTT Hardware Device from Domoticz.\nPlease verify that you have added the MQTT Hardware Device and that the hardware device is enabled.");
    };

    Domoticz.hardware(platform.apiBaseURL, function(hardware) {
        var mqttHardware = false;
        for (var i = 0; i < hardware.length; i++) {
            if (hardware[i].Type == Constants.HardwareTypeMQTT) {
                mqttHardware = hardware[i];
                break;
            }
        }

        if (mqttHardware === false || (mqttHardware.Enabled != "true")) {
            mqttError();
            return;
        }

        if (typeof platform.config.mqtt.host === 'undefined') {
            connectionInformation.host = mqttHardware.Address;
        }

        if (typeof platform.config.mqtt.port === 'undefined') {
            connectionInformation.port = mqttHardware.Port;
        }

        if (typeof platform.config.mqtt.username === 'undefined') {
            connectionInformation.username = mqttHardware.Username;
        }

        if (typeof platform.config.mqtt.password === 'undefined') {
            connectionInformation.password = mqttHardware.Password;
        }

        eDomoticzBasePlatform.mqtt = new Mqtt(platform, connectionInformation.host, connectionInformation.port, connectionInformation.topic, {
            username: connectionInformation.username,
            password: connectionInformation.password
        });
        platform.mqtt = eDomoticzBasePlatform.mqtt;
    }, mqttError);
};

module.exports = eDomoticzBasePlatform;