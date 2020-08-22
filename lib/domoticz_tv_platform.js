const eDomoticzBasePlatform = require('./domoticz_base_platform');
const eDomoticzTVAccessory = require('./domoticz_tv_accessory');
const Helper = require('./helper').Helper;

function eDomoticzTVPlatform(log, config, api) {
    eDomoticzBasePlatform.call(this, log, config, api);
}

eDomoticzTVPlatform.prototype = {
    newAccessory: function(device, platformAccessory, uuid, eve) {
        return new eDomoticzTVAccessory(this, platformAccessory, device.idx, device.Name, uuid, device.SwitchTypeVal, device.HardwareID, device.HardwareTypeVal, device.Image);
    },
    publishAccessory: function(accessory) {
        // Handled by external platform accessory.
    },
    shouldProcessDevice: function(device) {
        return eDomoticzTVAccessory.isTelevisionDevice(device.SwitchTypeVal, device.Image);
    }
};
Helper.fixInheritance(eDomoticzTVPlatform, eDomoticzBasePlatform);

module.exports = eDomoticzTVPlatform;