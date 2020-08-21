const eDomoticzBasePlatform = require('./domoticz_base_platform');
const eDomoticzTVAccessory = require('./domoticz_tv_accessory');
const Helper = require('./lib/helper').Helper;

module.exports = eDomoticzTVPlatform;

eDomoticzTVPlatform.prototype = {
    newAccessory: function(device, platformAccessory, uuid, eve) {
        return new eDomoticTVAccessory(this, platformAccessory, device.idx, device.Name, uuid, device.SwitchTypeVal, device.HardwareID, device.HardwareTypeVal, device.Image);
    },
    removeAccessory: function(accessory) {
        accessory.removed();
        eDomoticzBasePlatform.prototype.removeAccessory.call(this, accessory);
    },
    publishAccessory: function(accessory) {
        try {
            this.api.publishExternalAccessories("homebridge-edomoticz-tv", [accessory.platformAccessory]);
        } catch (e) {
            this.log("Could not register TV platform accessory! (" + accessory.name + ")\n" + e);
        }
    },
    shouldProcessDevice: function(device) {
        return !eDomoticzTVAccessory.isTelevisionAccessory(device.SwitchTypeVal, device.Image);
    }
};
Helper.fixInheritance(eDomoticzTVPlatform, eDomoticzBasePlatform);