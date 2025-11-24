
import { DesignAsset, IoTDeviceConfig } from "../types";

/**
 * ARCHITEX IOT ENGINE
 * 
 * Analyzes architectural blueprints to automatically place and configure smart home devices.
 * Exports standardized configurations compatible with Home Assistant, OpenHAB, etc.
 */
class IoTService {
    
    /**
     * Simulates AI analysis of a blueprint to identify optimal device placement.
     * e.g. Recognizing "Living Room" and adding Lights/Thermostats.
     */
    extractDevicesFromDesign(design: DesignAsset): IoTDeviceConfig[] {
        // Mock logic: deterministic generation based on design ID string char codes
        const seed = design.id.length;
        const devices: IoTDeviceConfig[] = [];

        // Add Lights
        devices.push({
            id: `dev_light_${seed}_1`,
            type: 'LIGHT',
            room: 'Living Room',
            coordinates: { x: 2, y: 2, z: 3 },
            protocol: 'ZIGBEE'
        });
        
        devices.push({
            id: `dev_light_${seed}_2`,
            type: 'LIGHT',
            room: 'Kitchen',
            coordinates: { x: 5, y: 2, z: 3 },
            protocol: 'ZIGBEE'
        });

        // Add Thermostat
        devices.push({
            id: `dev_therm_${seed}`,
            type: 'THERMOSTAT',
            room: 'Hallway',
            coordinates: { x: 3.5, y: 4, z: 1.5 },
            protocol: 'WIFI'
        });

        // Add Outlets
        devices.push({
            id: `dev_outlet_${seed}`,
            type: 'OUTLET',
            room: 'Master Bedroom',
            coordinates: { x: 1, y: 1, z: 0.5 },
            protocol: 'ZWAVE'
        });

        return devices;
    }

    /**
     * Generates a Home Assistant compatible YAML configuration string.
     */
    generateHomeAssistantConfig(devices: IoTDeviceConfig[]): string {
        let yaml = `# Architex Smart Home Auto-Config
# Generated: ${new Date().toISOString()}
# Integration: Home Assistant

homeassistant:
  name: Architex Home
  unit_system: metric

# Devices
`;
        // Group by type
        const lights = devices.filter(d => d.type === 'LIGHT');
        if (lights.length > 0) {
            yaml += `\nlight:\n`;
            lights.forEach(d => {
                yaml += `  - platform: mqtt\n    name: "${d.room} Main Light"\n    command_topic: "home/${d.room.toLowerCase().replace(' ', '_')}/light/switch"\n`;
            });
        }

        const climates = devices.filter(d => d.type === 'THERMOSTAT');
        if (climates.length > 0) {
            yaml += `\nclimate:\n`;
            climates.forEach(d => {
                yaml += `  - platform: generic_thermostat\n    name: "${d.room} Thermostat"\n    target_sensor: sensor.${d.room.toLowerCase()}_temp\n`;
            });
        }

        const outlets = devices.filter(d => d.type === 'OUTLET');
        if (outlets.length > 0) {
            yaml += `\nswitch:\n`;
            outlets.forEach(d => {
                yaml += `  - platform: template\n    switches:\n      ${d.room.toLowerCase().replace(' ', '_')}_outlet:\n        friendly_name: "${d.room} Outlet"\n`;
            });
        }

        return yaml;
    }

    /**
     * Triggers a browser download of the configuration file.
     */
    downloadConfig(design: DesignAsset) {
        const devices = this.extractDevicesFromDesign(design);
        const yaml = this.generateHomeAssistantConfig(devices);
        
        const blob = new Blob([yaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `architex_iot_${design.id}.yaml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export const iotService = new IoTService();
