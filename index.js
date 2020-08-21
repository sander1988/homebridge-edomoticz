//         ____                        _   _
//     ___|  _ \  ___  _ __ ___   ___ | |_(_) ___ ____
//    / _ | | | |/ _ \| '_ ` _ \ / _ \| __| |/ __|_  /
//   |  __| |_| | (_) | | | | | | (_) | |_| | (__ / /
//    \___|____/ \___/|_| |_| |_|\___/ \__|_|\___/___|
//       www.npmjs.com/package/homebridge-edomoticz
//
//   A Platform Plugin for HomeBridge by Marci & TheRamon
//           [http://twitter.com/marcisshadow]
//           [http://domoticz.com/forum/memberlist.php?mode=viewprofile&u=10884]
//
//     ** Remember to add platform to config.json **
//
// Example ~/.homebridge/config.json content:
//
// {
//  "bridge": {
//         "name": "Homebridge",
//         "username": "CC:21:3E:E4:DE:33", // << Randomize this...
//         "port": 51826,
//         "pin": "031-45-154",
//      },
//
//  "platforms": [{
//         "platform": "eDomoticz",
//         "name": "eDomoticz",
//         "server": "127.0.0.1",   // or "user:pass@ip"
//         "port": "8080",
//         "roomid": 0 ,  // 0 = all sensors, otherwise, room idx as shown at http://server:port/#/Roomplan
//         "ssl": 0,
//         "mqtt": true
//      }],
//
//  "accessories":[]
// }
//
const Helper = require('./lib/helper').Helper;
const eDomoticzServices = require('./lib/services').eDomoticzServices;
const eDomoticzPlatform = require('./lib/domoticz_platform');
const eDomoticzTVPlatform = require('./lib/domoticz_tv_platform');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    Types = homebridge.hapLegacyTypes;
    UUID = homebridge.hap.uuid;

    Helper.fixInheritance(eDomoticzServices.TotalConsumption, Characteristic);
    Helper.fixInheritance(eDomoticzServices.CurrentConsumption, Characteristic);
    Helper.fixInheritance(eDomoticzServices.GasConsumption, Characteristic);
    Helper.fixInheritance(eDomoticzServices.TempOverride, Characteristic);
    Helper.fixInheritance(eDomoticzServices.MeterDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.GasDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.Ampere, Characteristic);
    Helper.fixInheritance(eDomoticzServices.AMPDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.Volt, Characteristic);
    Helper.fixInheritance(eDomoticzServices.VOLTDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.CurrentUsage, Characteristic);
    Helper.fixInheritance(eDomoticzServices.UsageDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.TodayConsumption, Characteristic);
    Helper.fixInheritance(eDomoticzServices.Barometer, Characteristic);
    Helper.fixInheritance(eDomoticzServices.WaterFlow, Characteristic);
    Helper.fixInheritance(eDomoticzServices.TotalWaterFlow, Characteristic);
    Helper.fixInheritance(eDomoticzServices.WaterDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.WeatherService, Service);
    Helper.fixInheritance(eDomoticzServices.WindSpeed, Characteristic);
    Helper.fixInheritance(eDomoticzServices.WindChill, Characteristic);
    Helper.fixInheritance(eDomoticzServices.WindDirection, Characteristic);
    Helper.fixInheritance(eDomoticzServices.WindDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.Rainfall, Characteristic);
    Helper.fixInheritance(eDomoticzServices.RainDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.Visibility, Characteristic);
    Helper.fixInheritance(eDomoticzServices.VisibilityDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.SolRad, Characteristic);
    Helper.fixInheritance(eDomoticzServices.SolRadDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.LocationService, Service);
    Helper.fixInheritance(eDomoticzServices.Location, Characteristic);
    Helper.fixInheritance(eDomoticzServices.InfotextDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.Infotext, Characteristic);
    Helper.fixInheritance(eDomoticzServices.UVDeviceService, Service);
    Helper.fixInheritance(eDomoticzServices.UVIndex, Characteristic);

    homebridge.registerPlatform("homebridge-edomoticz", "eDomoticz", eDomoticzPlatform, true);
    homebridge.registerPlatform("homebridge-edomoticz-tv", "eDomoticzTV", eDomoticzTVPlatform, true);
};