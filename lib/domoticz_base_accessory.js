function eDomoticzBaseAccessory(platform, platformAccessory, idx, name) {
    this.services = [];
    this.cachedValues = {};
    this.platform = platform;
    this.platformAccessory = platformAccessory;
    this.idx = idx;
    this.idx2 = 0;
    this.name = name;
}

eDomoticzBaseAccessory.prototype = {
    identify: function (callback) {
        callback();
    },
    publishServices: function () {
        this.platformAccessory.reachable = true;

        var services = this.getServices();
        for (var i = 0; i < services.length; i++) {
            this.publishService(services[i]);
        }
    },
    publishService: function (service) {
        var existingService = this.platformAccessory.services.find(function (eService) {
            return eService.UUID == service.UUID && eService.subtype == service.subtype;
        });

        if (!existingService) {
            this.platformAccessory.addService(service, this.name);
        }
    },
    getService: function (name, subtype) {
        var service = false;
        try {
            if (subtype) {
                service = this.platformAccessory.getServiceByUUIDAndSubType(name, subtype);
            } else {
                service = this.platformAccessory.getService(name);
            }
        } catch (e) {
            service = false;
        }

        if (!service) {
            var targetService = new name();
            service = this.platformAccessory.services.find(function (existingService) {
                return existingService.UUID == targetService.UUID && existingService.subtype == targetService.subtype;
            });
        }

        return service;
    },
    getCharacteristic: function (service, name) {
        var characteristic = false;
        try {
            characteristic = service.getCharacteristic(name);
        } catch (e) {
            characteristic = false;
        }

        if (!characteristic) {
            var targetCharacteristic = new name();
            characteristic = service.characteristics.find(function (existingCharacteristic) {
                return existingCharacteristic.UUID == targetCharacteristic.UUID && existingCharacteristic.subtype == targetCharacteristic.subtype;
            });
        }

        return characteristic;
    },
    gracefullyAddCharacteristic: function (service, characteristicType) {
        var characteristic = this.getCharacteristic(service, characteristicType);
        if (characteristic) {
            return characteristic;
        }

        return service.addCharacteristic(new characteristicType());
    },
};

module.exports = eDomoticzBaseAccessory;