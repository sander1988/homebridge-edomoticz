const eDomoticzBaseAccessory = require('./domoticz_base_accessory');

const Constants = require('./constants');
const Helper = require('./helper').Helper;
const Domoticz = require('./domoticz').Domoticz;

function eDomoticzTVAccessory(platform, platformAccessory, idx, name, uuid, swTypeVal, hwId, hwType, image) {
    eDomoticzBaseAccessory.call(this, platform, platformAccessory, idx, name);

    this.swTypeVal = swTypeVal;
    this.hwId = hwId;
    this.hwType = hwType;
    this.image = image;

    if (!this.platformAccessory) {
        // Create a seperate platform for each TV.
        // As HomeKit only allows one TV for each platform and we would like to support multiple TVs.
        this.platformAccessory = new platform.api.platformAccessory(
            this.name,
            UUID.generate('homebridge-edomoticz-tv:' + this.name),
            platform.api.hap.Accessory.Categories.TELEVISION
        );
    }

    this.prepareServices();
}

eDomoticzTVAccessory.prototype = {
    publishServices: function() {
        eDomoticzBaseAccessory.prototype.publishServices.call(this);

        try {
            this.platform.api.publishExternalAccessories("homebridge-edomoticz-tv", [this.platformAccessory]);
        } catch (e) {
            this.platform.log("Could not register TV platform accessory! (" + this.name + ")\n" + e);
        }
    },
    setActiveState: function (state, callback, context) {
        if (context && context == "eDomoticz-MQTT") {
            callback();
            return;
        }

        Domoticz.updateDeviceStatus(this, "switchlight", {
            "switchcmd": (state ? "On" : "Off")
        }, function (success) {
            this.cachedValues[Characteristic.Active.UUID] = state;
            callback();
        }.bind(this));
    },
    getActiveState: function (callback) {
        var cachedValue = this.cachedValues[Characteristic.Active.UUID];
        if (typeof cachedValue !== 'undefined') {
            callback(null, cachedValue);
        }

        Domoticz.deviceStatus(this, function (json) {
            var value;
            var sArray = Helper.sortByKey(json.result, "Name");
            sArray.map(function (s) {
                value = (s.Status == "Off") ? false : true;
            }.bind(this));
            
            if (typeof cachedValue === 'undefined') {
                callback(null, value);
            }

            this.cachedValues[Characteristic.Active.UUID] = value;
        }.bind(this));    
    },
    sendTelevisionRemoteKey: function (key, callback) {
        if(this.mediaCommandMapping && key in this.mediaCommandMapping) {
            Domoticz.updateDeviceStatus(this, "kodimediacommand", {
                "action": this.mediaCommandMapping[key],
            }, function (success) {
                callback();
            }.bind(this));
        } else {
            callback(new Error("Unsupported remote key!"));
        }
    },
    setTelevisionVolume: function (action, callback) {
        var domoticzAction;
        if (action == Characteristic.VolumeSelector.INCREMENT) {
            domoticzAction = "VolumeUp";
        } else if (action == Characteristic.VolumeSelector.DECREMENT) {
            domoticzAction = "VolumeDown";
        } else {
            callback(new Error("Unsupported volume action!"));
            return;
        }

        Domoticz.updateDeviceStatus(this, "kodimediacommand", {
            "action": domoticzAction
        }, function (success) {
            callback();
        }.bind(this));
    },
    setTelevisionMuteState: function (state, callback, context) {
        if (context && context == "eDomoticz-MQTT") {
            callback();
            return;
        }

        Domoticz.updateDeviceStatus(this, "kodimediacommand", {
            "action": "Mute",
        }, function (success) {
            this.cachedValues[Characteristic.Mute.UUID] = state;
            callback();
        }.bind(this));
    },
    getTelevisionMuteState: function (callback) {
        var cachedValue = this.cachedValues[Characteristic.Mute.UUID];
        if (typeof cachedValue !== 'undefined') {
            callback(null, cachedValue);
        }

        Domoticz.deviceStatus(this, function (json) {
            var value;
            var sArray = Helper.sortByKey(json.result, "Name");
            sArray.map(function (s) {
                value = (s.Data.indexOf("(muted)") > -1);
            }.bind(this));

            if (typeof cachedValue === 'undefined') {
                callback(null, value);
            }

            this.cachedValues[Characteristic.Mute.UUID] = value;
        }.bind(this));
    },
    setActiveIdentifier: function (identifier, callback, context) {
        if (context && context == "eDomoticz-MQTT") {
            callback();
            return;
        }

        if (this.idx2) {
            Domoticz.updateDeviceStatus({
                idx: this.idx2,
                name: this.name,
                platform: this.platform
            }, "switchlight", {
                "switchcmd": "Set Level",
                "level": identifier * 10
            }, function (success) {
                this.cachedValues[Characteristic.ActiveIdentifier.UUID] = identifier;
                callback();
            }.bind(this));
        }
    },
    getActiveIdentifier: function (callback) {
        var cachedValue = this.cachedValues[Characteristic.ActiveIdentifier.UUID];
        if (typeof cachedValue !== 'undefined') {
            callback(null, cachedValue);
        }

        if (this.idx2) {
            Domoticz.deviceStatus({
                idx: this.idx2,
                name: this.name,
                platform: this.platform
            }, function (json) {
                var value = 0;
                var sArray = Helper.sortByKey(json.result, "Name");
                sArray.map(function (s) {
                    value = s.Level / 10;
                }.bind(this));

                if (typeof cachedValue === 'undefined') {
                    callback(null, value);
                }

                this.cachedValues[Characteristic.ActiveIdentifier.UUID] = value;
            }.bind(this));
        } else if (typeof cachedValue === 'undefined') {
            this.cachedValues[Characteristic.ActiveIdentifier.UUID] = 0;
            callback(null, 0);
        } 
    },
    handleMQTTMessage: function (message, callback) {
        this.platform.log("MQTT Message received by Domoticz TV accessory for %s.\nMQTT Message:\n%s", this.name, JSON.stringify(message, null, 4));

        switch (true) {
        case eDomoticzTVAccessory.isTelevisionDevice(this.swTypeVal):
            {
                // TV power state.
                var tvService = this.getService(Service.Television);

                var activeCharacteristic = this.getCharacteristic(tvService, Characteristic.Active);
                var state = (message.nvalue > 0) ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE;
                var oldState = this.cachedValues[Characteristic.Active.UUID];
                if (state != oldState) {
                    this.cachedValues[Characteristic.Active.UUID] = state;
                    callback(activeCharacteristic, state);
                }

                // TV mute state.
                var tvSpeakerService = this.getService(Service.TelevisionSpeaker);

                var mutedCharacteristic = this.getCharacteristic(tvSpeakerService, Characteristic.Mute);
                var isMuted = value = (message.svalue1.indexOf("(muted)") > -1);
                var oldIsMuted = this.cachedValues[Characteristic.Mute.UUID];
                if (isMuted != oldIsMuted) {
                    this.cachedValues[Characteristic.Mute.UUID] = isMuted;
                    callback(mutedCharacteristic, isMuted);
                }

                break;
            }
        case eDomoticzTVAccessory.isTelevisionSourceDevice(this.swTypeVal, this.image):
            {
                /*var tvAccessory = tvAccessories[this.hwId.toString()];
                var tvService = tvAccessory.getService(Service.Television);
                var characteristic = tvAccessory.getCharacteristic(tvService, Characteristic.ActiveIdentifier);
                var identifier = parseInt(message.svalue1) / 10;
                var oldIdentifier = tvAccessory.cachedValues[Characteristic.ActiveIdentifier.UUID];

                if (identifier != oldIdentifier) {
                    tvAccessory.cachedValues[Characteristic.ActiveIdentifier.UUID] = identifier;
                    callback(characteristic, identifier);
                }*/
            }
            break;
        default:
            break;
        }
    },
    prepareServices: function () {
        this.services = [];

        switch (true) {
            case eDomoticzTVAccessory.isTelevisionDevice(this.swTypeVal): {
                // Info service.
                var informationService = this.getService(Service.AccessoryInformation);
                if (!informationService) {
                    informationService = new Service.AccessoryInformation();
                }
                informationService.setCharacteristic(Characteristic.Manufacturer, "eDomoticz TV").setCharacteristic(Characteristic.Model, this.hwType).setCharacteristic(Characteristic.SerialNumber, "Domoticz Hardware ID " + this.hwId);
                this.services.push(informationService);

                // TV control.
                if (!this.mediaCommandMapping) {
                    this.mediaCommandMapping = {};
                    this.mediaCommandMapping[Characteristic.RemoteKey.REWIND] = 'Rewind';
                    this.mediaCommandMapping[Characteristic.RemoteKey.FAST_FORWARD] = 'FastForward';
                    this.mediaCommandMapping[Characteristic.RemoteKey.NEXT_TRACK] = 'BigStepForward';
                    this.mediaCommandMapping[Characteristic.RemoteKey.PREVIOUS_TRACK] = 'BigStepBack';
                    this.mediaCommandMapping[Characteristic.RemoteKey.ARROW_UP] = 'Up';
                    this.mediaCommandMapping[Characteristic.RemoteKey.ARROW_DOWN] = 'Down';
                    this.mediaCommandMapping[Characteristic.RemoteKey.ARROW_LEFT] = 'Left';
                    this.mediaCommandMapping[Characteristic.RemoteKey.ARROW_RIGHT] = 'Right';
                    this.mediaCommandMapping[Characteristic.RemoteKey.SELECT] = 'Select';
                    this.mediaCommandMapping[Characteristic.RemoteKey.BACK] = 'Back';
                    this.mediaCommandMapping[Characteristic.RemoteKey.EXIT] = 'Back';
                    this.mediaCommandMapping[Characteristic.RemoteKey.PLAY_PAUSE] = 'PlayPause';
                    this.mediaCommandMapping[Characteristic.RemoteKey.INFORMATION] = 'Info';
                }

                var tvService = this.getService(Service.Television);
                if (!tvService) {
                    tvService = new Service.Television(this.name);
                }
                tvService
                    .setCharacteristic(Characteristic.ConfiguredName, this.name)
                    .setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
                this.getCharacteristic(tvService, Characteristic.Active)
                    .on('set', this.setActiveState.bind(this))
                    .on('get', this.getActiveState.bind(this));
                this.getCharacteristic(tvService, Characteristic.ActiveIdentifier)
                    .on('set', this.setActiveIdentifier.bind(this))
                    .on('get', this.getActiveIdentifier.bind(this));
                this.getCharacteristic(tvService, Characteristic.RemoteKey)
                    .on('set', this.sendTelevisionRemoteKey.bind(this));
                this.services.push(tvService);

                // TV volume.
                var tvSpeakerService = this.getService(Service.TelevisionSpeaker);
                if (!tvSpeakerService) {
                    tvSpeakerService = new Service.TelevisionSpeaker(this.name + ' volume', 'tvSpeakerService');
                }
                tvSpeakerService
                    .setCharacteristic(Characteristic.VolumeControlType, Characteristic.VolumeControlType.RELATIVE);
                this.getCharacteristic(tvSpeakerService, Characteristic.VolumeSelector)
                    .on('set', this.setTelevisionVolume.bind(this));
                this.getCharacteristic(tvSpeakerService, Characteristic.Mute)
                    .on('set', this.setTelevisionMuteState.bind(this))
                    .on('get', this.getTelevisionMuteState.bind(this));
                tvService.addLinkedService(tvSpeakerService);
                this.services.push(tvSpeakerService);

                // TV input service.
                // Try to find the (optional) source selector switch in the same hardware.
                Domoticz.devices(this.platform.apiBaseURL, this.platform.room, function (devices) {
                    var inputDevice = devices.find(function (device) {
                        return (device.HardwareID == this.hwId && eDomoticzTVAccessory.isTelevisionSourceDevice(device.SwitchTypeVal, device.Image));
                    }.bind(this));

                    if (inputDevice) {
                        this.idx2 = inputDevice.idx;
                        //this.platform.log("Found television source device " + this.idx2 + " found in Domoticz for hardware ID: " + this.hwId);
                        this.createTelevisionInputService(tvService);
                    } else {
                        this.platform.log("No television source device found in Domoticz for hardware ID: " + this.hwId + ". Not creating input source service.");
                        this.publishServices();
                    }
                }.bind(this));
                break;
            }
        }
    },
    getServices: function() {
        return this.services;
    },
    createTelevisionInputService: function(tvService) {
        Domoticz.deviceStatus({
            idx: this.idx2,
            name: this.name,
            platform: this.platform
        }, function (json) {
            var sArray = Helper.sortByKey(json.result, "Name");
            sArray.map(function (s) {
                var inputs = new Buffer(s.LevelNames, 'base64').toString("utf8").split("|");
                if(inputs.length > 0 && (inputs[0].toLowerCase() == "off" || inputs[0].toLowerCase() == "none")) {
                    inputs.shift();
                }

                inputs.forEach((input, index) => {
                    var inputType;
                    switch (true) {
                        case input.match(/^TV|Live$/i):
                            inputType = Characteristic.InputSourceType.TUNER;
                            break;
                        case input.match(/hdmi/i):
                            inputType = Characteristic.InputSourceType.HDMI;
                            break;
                        case input.match(/ypbpr/i):
                            inputType = Characteristic.InputSourceType.COMPONENT_VIDEO;
                            break;
                        default:
                            inputType = Characteristic.InputSourceType.APPLICATION;
                            break;
                    }

                    var inputService = this.getService(Service.InputSource, input);
                    if (!inputService) {
                        inputService = new Service.InputSource(input.replace(/\s/g, '').toLowerCase(), input);
                    }
                    inputService
                        .setCharacteristic(Characteristic.Identifier, index + 1)
                        .setCharacteristic(Characteristic.ConfiguredName, input)
                        .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED)
                        .setCharacteristic(Characteristic.InputSourceType, inputType)
                        .setCharacteristic(Characteristic.CurrentVisibilityState, Characteristic.CurrentVisibilityState.SHOWN);
                    tvService.addLinkedService(inputService);
                    this.services.push(inputService);
                });

                this.publishServices();
            }.bind(this));
        }.bind(this));
    }
};
Helper.fixInheritance(eDomoticzTVAccessory, eDomoticzBaseAccessory);

eDomoticzTVAccessory.isTelevisionDevice = function(swTypeVal) {
    return (swTypeVal == Constants.DeviceTypeMedia);
};

eDomoticzTVAccessory.isTelevisionSourceDevice = function(swTypeVal, image) {
    return (swTypeVal == Constants.DeviceTypeSelector && image == "TV");
};

eDomoticzTVAccessory.isTelevisionAccessory = function(swTypeVal, image) {
    return (eDomoticzTVAccessory.isTelevisionDevice(swTypeVal)
        || eDomoticzTVAccessory.isTelevisionSourceDevice(swTypeVal, image));
};

module.exports = eDomoticzTVAccessory;