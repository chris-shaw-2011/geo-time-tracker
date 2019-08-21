import React, { Fragment } from "react"
import { Marker, Circle } from "react-native-maps";
import GeofenceType from "../Classes/Geofence"

interface MapGeofenceProps {
    geofence: GeofenceType,
    primary?: boolean,
}

const MapGeofence = ({ geofence, primary }: MapGeofenceProps) => (
    <Fragment>
        <Marker coordinate={geofence.coords} title={geofence.name} pinColor="wheat" opacity={primary ? 1 : 0.5} />
        <Circle center={geofence.coords} radius={geofence.radius} strokeColor={primary ? "white" : "rgba(255,255,255,0.25)"} fillColor={primary ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)"} />
    </Fragment>
)

export default MapGeofence;