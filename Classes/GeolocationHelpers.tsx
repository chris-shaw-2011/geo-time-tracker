import Geolocation, { GeolocationResponse } from "@react-native-community/geolocation";

class GeolocationHelpers {
    async getCurrentPosition(): Promise<GeolocationResponse> {
        return new Promise(resolve => {
            Geolocation.getCurrentPosition(location => {
                resolve(location)
            }, undefined, {
                timeout: 60000,
                enableHighAccuracy: true,
                maximumAge: 0,
            })
        })
    }
}

const helpers = new GeolocationHelpers();

export default helpers;