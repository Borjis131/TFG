export class Measure {
    id?: number;
    time_stamp?: Date;
    temperature: number;
    air_humidity: number;
    soil_humidity: number;
    light_intensity: number;
    water_level: number;
    light_switch?: boolean;
    pump?: boolean;
}