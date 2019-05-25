import { LatLng } from "react-native-maps";

export default class Geofence {
    constructor(name?: string, coords?: LatLng, radius?: number) {
        this.name = name || "";
        this.coords = coords || { latitude: 0, longitude: 0 }
        this.radius = radius || 0;
    }

    public name: string;
    public coords: LatLng
    public radius: number;
}