const Helper = require('./helper').Helper;

module.exports = {
    eDomoticzServices: eDomoticzServices
};


function eDomoticzServices() {

}

/* Define Custom Services & Characteristics */
// PowerMeter Characteristics
eDomoticzServices.TotalConsumption = Helper.createCustomCharacteristic(
    'Total Consumption',
    'E863F10C-079E-48FF-8F27-9C2605A29F52',
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'kWh'
    }
);

eDomoticzServices.TodayConsumption = Helper.createCustomCharacteristic(
    'Today',
    UUID.generate('eDomoticz:customchar:TodayConsumption'),
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'kWh'
    }
);


eDomoticzServices.CurrentConsumption = Helper.createCustomCharacteristic(
    'Consumption',
    'E863F10D-079E-48FF-8F27-9C2605A29F52',
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'W'
    }
);

eDomoticzServices.Ampere = Helper.createCustomCharacteristic(
    'Amps',
    'E863F126-079E-48FF-8F27-9C2605A29F52',
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'A'
    }
);

eDomoticzServices.Volt = Helper.createCustomCharacteristic(
    'Volts',
    'E863F10A-079E-48FF-8F27-9C2605A29F52',
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'V'
    }
);

eDomoticzServices.GasConsumption = Helper.createCustomCharacteristic(
    'Meter Total',
    UUID.generate('eDomoticz:customchar:CurrentConsumption'),
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    }
);

eDomoticzServices.WaterFlow = Helper.createCustomCharacteristic(
    'Flow Rate',
    UUID.generate('eDomoticz:customchar:WaterFlow'),
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'm3'
    }
);

eDomoticzServices.TotalWaterFlow = Helper.createCustomCharacteristic(
    'Flow Total',
    UUID.generate('eDomoticz:customchar:TotalWaterFlow'),
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'l'
    }
);

// Custom SetPoint Minutes characteristic for TempOverride modes
eDomoticzServices.TempOverride = Helper.createCustomCharacteristic(
    'Override (Mins, 0 = Auto, 481 = Permanent)',
    UUID.generate('eDomoticz:customchar:OverrideTime'),
    {
        format: Characteristic.Formats.FLOAT,
        maxValue: 481,
        minValue: 0,
        minStep: 1,
        unit: 'mins',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    }
);

// Ampere Meter
eDomoticzServices.AMPDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:powermeter:customservice'),
    [
        new eDomoticzServices.Ampere()
    ]
);

// Voltage Meter
eDomoticzServices.VOLTDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:powermeter:customservice'),
    [
        new eDomoticzServices.Volt()
    ]
);

// The PowerMeter itself
eDomoticzServices.MeterDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:powermeter:customservice'),
    [
        new eDomoticzServices.CurrentConsumption()
    ],
    [
        new eDomoticzServices.TotalConsumption(),
        new eDomoticzServices.TodayConsumption()
    ]
);

// Waterflow Meter
eDomoticzServices.WaterDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:watermeter:customservice'),
    [
        new eDomoticzServices.WaterFlow()
    ],
    [
        new eDomoticzServices.TotalWaterFlow()
    ]
);

// P1 Smart Meter -> Gas
eDomoticzServices.GasDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:gasmeter:customservice'),
    [
        new eDomoticzServices.GasConsumption()
    ]
);

// Usage Meter Characteristics
eDomoticzServices.CurrentUsage = Helper.createCustomCharacteristic(
    'Current Usage',
    UUID.generate('eDomoticz:customchar:CurrentUsage'),
    {
        format: Characteristic.Formats.FLOAT,
        unit: Characteristic.Units.PERCENTAGE,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        minValue:0,
        maxValue:100,
        minStep:0.1
    }
);

// The Usage Meter itself
eDomoticzServices.UsageDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:usagedevice:customservice'),
    [
        new eDomoticzServices.CurrentUsage()
    ]
);

// Location Meter (sensor should have 'Location' in title)
eDomoticzServices.Location = Helper.createCustomCharacteristic(
    'Location',
    UUID.generate('eDomoticz:customchar:Location'),
    {
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    }
);

eDomoticzServices.LocationService = Helper.createCustomService(
    UUID.generate('eDomoticz:location:customservice'),
    [
        new eDomoticzServices.Location()
    ]
);

// DarkSkies WindSpeed Characteristic
eDomoticzServices.WindSpeed = Helper.createCustomCharacteristic(
    'Wind Speed',
    '49C8AE5A-A3A5-41AB-BF1F-12D5654F9F41',
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit:'m/s',
        minValue:0,
        maxValue:360,
        minStep:0.1
    }
);

// DarkSkies WindChill Characteristic
eDomoticzServices.WindChill = Helper.createCustomCharacteristic(
    'Wind Chill',
    UUID.generate('eDomoticz:customchar:WindChill'),
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: Characteristic.Units.CELSIUS,
        minValue:-50,
        maxValue:100,
        minStep:0.1
    }
);

// DarkSkies WindDirection Characteristic
eDomoticzServices.WindDirection = Helper.createCustomCharacteristic(
    'Wind Direction',
    '46f1284c-1912-421b-82f5-eb75008b167e',
    {
        format: Characteristic.Formats.INT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: Characteristic.Units.ARC_DEGREE,
        minValue:0,
        maxValue:360,
        minStep:1
    }
);

// DarkSkies Virtual Wind Sensor
eDomoticzServices.WindDeviceService = Helper.createCustomService(
    '2AFB775E-79E5-4399-B3CD-398474CAE86C',
    [
        new eDomoticzServices.WindSpeed()
    ],
    [
        new eDomoticzServices.WindChill(),
        new eDomoticzServices.WindDirection(),
        new Characteristic.CurrentTemperature()
    ]
);

// DarkSkies Rain Characteristics
eDomoticzServices.Rainfall = Helper.createCustomCharacteristic(
    'Amount today',
    'ccc04890-565b-4376-b39a-3113341d9e0f',
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'mm',
        minValue:0,
        maxValue:360,
        minStep:0.1
    }
);

// DarkSkies Rain Meter itself
eDomoticzServices.RainDeviceService = Helper.createCustomService(
    'D92D5391-92AF-4824-AF4A-356F25F25EA1',
    [
        new eDomoticzServices.Rainfall()
    ]
);

// DarkSkies Visibility Characteristics
eDomoticzServices.Visibility = Helper.createCustomCharacteristic(
    'Distance',
    'd24ecc1e-6fad-4fb5-8137-5af88bd5e857',
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'miles',
        minValue:0,
        maxValue:20,
        minStep:0.1
    }
);

// DarkSkies Visibility Meter itself
eDomoticzServices.VisibilityDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:visibilitydevice:customservice'),
    [
        new eDomoticzServices.Visibility()
    ]
);

// DarkSkies UVIndex Characteristics
eDomoticzServices.UVIndex = Helper.createCustomCharacteristic(
    'UVIndex',
    '05ba0fe0-b848-4226-906d-5b64272e05ce',
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'UVI',
        minValue:0,
        maxValue:20,
        minStep:0.1
    }
);

// DarkSkies UV Index Meter itself
eDomoticzServices.UVDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:uvdevice:customservice'),
    [
        new eDomoticzServices.UVIndex()
    ]
);

// DarkSkies Solar Radiation Characteristics
eDomoticzServices.SolRad = Helper.createCustomCharacteristic(
    'Radiation',
    UUID.generate('eDomoticz:customchar:SolRad'),
    {
        format: Characteristic.Formats.FLOAT,
        unit: 'W/m2',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        minValue:0,
        maxValue:10000,
        minStep:0.1
    }
);

// DarkSkies Solar Radiation Meter itself
eDomoticzServices.SolRadDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:solraddevice:customservice'),
    [
        new eDomoticzServices.SolRad()
    ]
);

// Barometer Characteristic
eDomoticzServices.Barometer = Helper.createCustomCharacteristic(
    'Pressure',
    'E863F10F-079E-48FF-8F27-9C2605A29F52',
    {
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'hPA',
        minValue: 500,
        maxValue: 2000,
        minStep: 0.1
    }
);

// Weather Service
eDomoticzServices.WeatherService = Helper.createCustomService(
    'debf1b79-312e-47f7-bf82-993d9950f3a2',
    [
        new Characteristic.CurrentTemperature()
    ],
    [
        new Characteristic.CurrentRelativeHumidity(),
        new eDomoticzServices.Barometer()
    ]
);

// DarkSkies Visibility Characteristics
eDomoticzServices.Infotext = Helper.createCustomCharacteristic(
    'Infotext',
    UUID.generate('eDomoticz:customchar:Infotext'),
    {
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    }
);

// DarkSkies Visibility Meter itself
eDomoticzServices.InfotextDeviceService = Helper.createCustomService(
    UUID.generate('eDomoticz:infotextdevice:customservice'),
    [
        new eDomoticzServices.Infotext()
    ]
);
/* End of Custom Services & Characteristics */
