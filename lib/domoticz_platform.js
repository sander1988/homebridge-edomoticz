const eDomoticzBasePlatform = require('./domoticz_base_platform');
const eDomoticzAccessory = require('./domoticz_accessory');
const eDomoticzTVAccessory = require('./domoticz_tv_accessory');
const Helper = require('./helper').Helper;

function eDomoticzPlatform(log, config, api) {
    eDomoticzBasePlatform.call(this, log, config, api);
}

eDomoticzPlatform.prototype = {
    newAccessory: function(device, platformAccessory, uuid, eve) {
        return new eDomoticzAccessory(this, platformAccessory, false, device.Used, device.idx, device.Name, uuid, device.HaveDimmer, device.MaxDimLevel, device.SubType, device.Type, device.BatteryLevel, device.SwitchType, device.SwitchTypeVal, device.HardwareID, device.HardwareTypeVal, device.Image, eve);
    },
    shouldProcessDevice: function(device) {
        return !eDomoticzTVAccessory.isTelevisionAccessory(device.SwitchTypeVal, device.Image);
    }
};
Helper.fixInheritance(eDomoticzPlatform, eDomoticzBasePlatform);

module.exports = eDomoticzPlatform;