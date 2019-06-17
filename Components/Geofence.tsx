import React, { Fragment } from "react"
import { Page } from "./Page";
import MapView, { MapEvent, Region, LatLng } from 'react-native-maps';
import { StyleSheet, GeolocationReturnType, Alert } from "react-native";
import { View, Input, Form, Item, Label, Button, Text, Icon } from "native-base";
import Loading from "./Loading";
import { NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";
import GeofenceType from "../Classes/Geofence"
import { computeDestinationPoint } from "geolib"
import GlobalSettingsContext from "../Classes/GlobalSettingsContext";
import MapGeofence from "./MapGeofence";
import GeolocationHelpers from "../Classes/GeolocationHelpers"

const styles = StyleSheet.create({
    fill: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    boxes: {
        position: "absolute",
        top: 10,
        width: "100%",
        zIndex: 10,
        display: "flex",
        justifyContent: "space-around",
        flexDirection: "row"
    },
    name: {
        flexGrow: 1,
        flexShrink: 1,
        backgroundColor: "rgba(255,255,255,0.75)",
        maxWidth: "65%",
    },
    radius: {
        backgroundColor: "rgba(255,255,255,0.75)",
    },
    input: {
        width: "100%",
    },
    buttonView: {
        position: "absolute",
        bottom: 10,
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
        flexDirection: "row",
        zIndex: 50,
    },
    caretViewRow: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
    },
    caret: {
        fontSize: 35,
        width: 35,
    },
    buttonText: {
        fontWeight: "bold",
    },
    error: {
        backgroundColor: "rgba(255,0,0,0.75)"
    }
});

interface Props {
    navigation: NavigationScreenProp<NavigationState, NavigationParams>
}

interface State {
    initialRegion: Region,
    loaded: boolean,
    nameError: boolean,
    initialGeofence?: GeofenceType,
    updatedGeofence: GeofenceType
}

enum MoveDirection {
    Up,
    Down,
    Left,
    Right,
}

export default class Geofence extends Page<Props, State> {
    title = "Geofence"
    map: MapView | null = null;

    constructor(props: Props) {
        super(props)

        this.positionUpdate = this.positionUpdate.bind(this);
        this.onTap = this.onTap.bind(this);
        this.radiusChanged = this.radiusChanged.bind(this);
        this.save = this.save.bind(this);
        this.nameChanged = this.nameChanged.bind(this);
        this.delete = this.delete.bind(this);
        this.deleteConfirm = this.deleteConfirm.bind(this);
        this.move = this.move.bind(this);

        var geofence = (props.navigation.getParam("geofence") as GeofenceType | undefined || new GeofenceType())
        var deltas = this.computeDeltas(geofence);

        this.state = {
            initialRegion: {
                latitude: geofence.coords.latitude,
                longitude: geofence.coords.longitude,
                longitudeDelta: deltas.longitudeDelta,
                latitudeDelta: deltas.latitudeDelta,
            },
            loaded: geofence.name ? true : false,
            updatedGeofence: geofence,
            nameError: false,
            initialGeofence: props.navigation.getParam("geofence"),
        }
    }

    computeDeltas(geofence: GeofenceType) {
        var deltas = {
            longitudeDelta: 0,
            latitudeDelta: 0,
        }

        if (geofence.coords.latitude && geofence.coords.longitude && geofence.radius) {
            var lat1 = computeDestinationPoint(geofence.coords, geofence.radius, 0).latitude
            var lat2 = computeDestinationPoint(geofence.coords, geofence.radius, 180).latitude
            var lng1 = computeDestinationPoint(geofence.coords, geofence.radius, 90).longitude
            var lng2 = computeDestinationPoint(geofence.coords, geofence.radius, 270).longitude

            deltas.longitudeDelta = lng1 > lng2 ? lng1 - lng2 : lng2 - lng1;
            deltas.latitudeDelta = lat1 > lat2 ? lat1 - lat2 : lat2 - lat1;
        }

        return deltas;
    }

    async componentDidMount() {
        if (!this.state.loaded) {
            const pos = await GeolocationHelpers.getCurrentPosition();

            this.positionUpdate(pos);
        }
    }

    positionUpdate(pos: GeolocationReturnType) {
        const geofence = new GeofenceType("", { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, 30)
        var deltas = this.computeDeltas(geofence)
        this.setState({
            initialRegion: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                latitudeDelta: deltas.latitudeDelta,
                longitudeDelta: deltas.longitudeDelta,
            },
            loaded: true,
            updatedGeofence: geofence,
        })
    }

    onTap(event: MapEvent) {
        const coord = event.nativeEvent.coordinate
        this.setState(oldState => ({
            updatedGeofence: new GeofenceType(oldState.updatedGeofence.name, coord, oldState.updatedGeofence.radius)
        }))
    }

    radiusChanged(radius: string) {
        this.setState(oldState => this.updateGeofenceAndCenter(oldState, undefined, parseInt(radius)))
    }

    nameChanged(name: string) {
        this.setState(oldState => ({
            updatedGeofence: new GeofenceType(name, oldState.updatedGeofence.coords, oldState.updatedGeofence.radius),
            nameError: !name,
        }))
    }

    async save() {
        const update = this.state.updatedGeofence;
        if (!this.state.nameError && update.name) {
            await this.context.updateGeofence(update, this.state.initialGeofence ? this.state.initialGeofence.name : undefined)

            this.props.navigation.goBack();
        }
        else {
            this.setState({
                nameError: true,
            })
        }
    }

    async move(direction: MoveDirection) {
        const bounds = await this.map!.getMapBoundaries();
        var updateCoord = this.state.updatedGeofence.coords;
        const latDelta = bounds.northEast.latitude > bounds.southWest.latitude ? bounds.northEast.latitude - bounds.southWest.latitude : bounds.southWest.latitude - bounds.northEast.latitude;
        const lngDelta = bounds.northEast.longitude > bounds.southWest.longitude ? bounds.northEast.longitude - bounds.southWest.longitude : bounds.southWest.longitude - bounds.northEast.longitude;

        switch (direction) {
            case MoveDirection.Up:
                updateCoord = {
                    latitude: updateCoord.latitude + (latDelta / 100),
                    longitude: updateCoord.longitude,
                };
                break;
            case MoveDirection.Down:
                updateCoord = {
                    latitude: updateCoord.latitude - (latDelta / 100),
                    longitude: updateCoord.longitude,
                };
                break;
            case MoveDirection.Left:
                updateCoord = {
                    latitude: updateCoord.latitude,
                    longitude: updateCoord.longitude - (lngDelta / 100),
                };
                break;
            case MoveDirection.Right:
                updateCoord = {
                    latitude: updateCoord.latitude,
                    longitude: updateCoord.longitude + (lngDelta / 100),
                };
                break;
        }

        this.setState(oldState => this.updateGeofenceAndCenter(oldState, updateCoord))
    }

    updateGeofenceAndCenter(oldState: Readonly<State>, coords?: LatLng, radius?: number) {
        const geofence = new GeofenceType(oldState.updatedGeofence.name, coords || oldState.updatedGeofence.coords, radius && radius >= 0 ? radius : oldState.updatedGeofence.radius);
        const deltas = this.computeDeltas(geofence);

        this.map!.animateToRegion({
            ...oldState.updatedGeofence.coords,
            ...deltas,
        })

        return {
            updatedGeofence: geofence,
        }
    }

    deleteConfirm() {
        if (this.state.initialGeofence) {
            const geofence = this.state.initialGeofence;

            Alert.alert("Delete?", `Are you sure you want to delete ${geofence.name}?`, [
                { text: "No", style: "cancel" },
                { text: "Yes", style: "destructive", onPress: async () => await this.delete(geofence) }
            ])
        }
        else {
            Alert.alert("Error", "Tried to delete a geofence that hasn't been saved yet")
        }
    }

    async delete(geofence: GeofenceType) {
        await this.context.updateGeofence(undefined, geofence.name);

        this.props.navigation.goBack();
    }

    render() {
        if (!this.state.loaded) {
            return <Loading />
        }

        return (
            <View style={styles.fill}>
                <View style={styles.fill}>
                    <MapView
                        style={styles.fill}
                        initialRegion={this.state.initialRegion}
                        mapType="satellite"
                        onPress={this.onTap}
                        ref={ref => this.map = ref}
                    >
                        <GlobalSettingsContext.Consumer>
                            {value =>
                                <Fragment>
                                    <MapGeofence geofence={this.state.updatedGeofence} primary />
                                    {value.geofences.map(g => !this.state.initialGeofence || this.state.initialGeofence.name != g.name ? <MapGeofence geofence={g} key={g.name} /> : null)}
                                </Fragment>
                            }
                        </GlobalSettingsContext.Consumer>
                    </MapView>
                </View>
                <Form>
                    <View style={styles.boxes}>
                        <Item style={[styles.name, this.state.nameError ? styles.error : null]} stackedLabel error={this.state.nameError}>
                            <Label>Name</Label>
                            <Input style={styles.input} value={this.state.updatedGeofence.name} onChangeText={this.nameChanged} />
                        </Item>
                        <View style={{ display: "flex", flexDirection: "row" }}>
                            <Item style={styles.radius} stackedLabel>
                                <Label>Radius</Label>
                                <Input style={styles.input} keyboardType="number-pad" value={this.state.updatedGeofence.radius ? this.state.updatedGeofence.radius.toString() : ""} onChangeText={this.radiusChanged} />
                            </Item>
                            <View style={{ height: "100%", display: "flex", justifyContent: "space-between", paddingLeft: 10 }}>
                                <Icon name="plussquare" type="AntDesign" style={{ ...styles.caret, backgroundColor: "white" }} onPress={() => this.radiusChanged((this.state.updatedGeofence.radius + 1).toString())} />
                                <Icon name="minussquare" type="AntDesign" style={{ ...styles.caret, backgroundColor: "white" }} onPress={() => this.radiusChanged((this.state.updatedGeofence.radius - 1).toString())} />
                            </View>
                        </View>
                    </View>
                </Form>
                <View style={styles.buttonView}>
                    <Button light onPress={this.save} style={{alignSelf: "flex-end"}}>
                        <Text style={styles.buttonText}>Save</Text>
                    </Button>
                    <View>
                        <View style={styles.caretViewRow}>
                            <View style={styles.caret} />
                            <Icon name="upsquare" type="AntDesign" style={{ ...styles.caret, backgroundColor: "white" }} onPress={() => this.move(MoveDirection.Up)} />
                            <View style={styles.caret} />
                        </View>
                        <View style={styles.caretViewRow}>
                            <Icon name="leftsquare" type="AntDesign" style={{ ...styles.caret, backgroundColor: "white" }} onPress={() => this.move(MoveDirection.Left)} />
                            <View style={styles.caret} />
                            <Icon name="rightsquare" type="AntDesign" style={{ ...styles.caret, backgroundColor: "white" }} onPress={() => this.move(MoveDirection.Right)} />
                        </View>
                        <View style={styles.caretViewRow}>
                            <View style={styles.caret} />
                            <Icon name="downsquare" type="AntDesign" style={{ ...styles.caret, backgroundColor: "white" }} onPress={() => this.move(MoveDirection.Down)} />
                            <View style={styles.caret} />
                        </View>
                    </View>
                    {this.state.initialGeofence && <Button danger onPress={this.deleteConfirm} style={{alignSelf: "flex-end"}}>
                        <Text style={styles.buttonText}>Delete</Text>
                    </Button>}
                </View>
            </View>
        )
    }
}