import React, { Fragment } from "react"
import { Page } from "./Page";
import NavigationOptions from "../Classes/NavigationOptions";
import MapView, { Marker, LatLng, MapEvent, Region, Circle } from 'react-native-maps'; // remove PROVIDER_GOOGLE import if not using Google Maps
import { StyleSheet, GeolocationReturnType, Alert } from "react-native";
import { View, Input, Container, Content, Form, Item, Label, Button, Text, Icon } from "native-base";
import Loading from "./Loading";
import { NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";
import GeofenceType from "../Classes/Geofence"
import { computeDestinationPoint } from "geolib"
import GlobalSettingsContext from "../Classes/GlobalSettingsContext";
import { LogicalExpression } from "@babel/types";

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
    flexDirection: "row"
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

export default class Geofence extends Page<Props, State> {
  title = "Geofence"

  constructor(props: Props) {
    super(props)

    this.positionUpdate = this.positionUpdate.bind(this);
    this.onTap = this.onTap.bind(this);
    this.radiusChanged = this.radiusChanged.bind(this);
    this.save = this.save.bind(this);
    this.nameChanged = this.nameChanged.bind(this);
    this.delete = this.delete.bind(this);
    this.deleteConfirm = this.deleteConfirm.bind(this);

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

  componentDidMount() {
    if (!this.state.loaded) {
      navigator.geolocation.getCurrentPosition(this.positionUpdate)
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
    var newRadius = parseInt(radius);

    this.setState(oldState => ({
      updatedGeofence: new GeofenceType(oldState.updatedGeofence.name, oldState.updatedGeofence.coords, newRadius && newRadius >= 0 ? newRadius : 0)
    }))
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
            <Item style={styles.radius} stackedLabel>
              <Label>Radius</Label>
              <Input style={styles.input} keyboardType="number-pad" value={this.state.updatedGeofence.radius ? this.state.updatedGeofence.radius.toString() : ""} onChangeText={this.radiusChanged} />
            </Item>
          </View>
        </Form>
        <View style={styles.buttonView}>
          <Button light onPress={this.save}>
            <Text style={styles.buttonText}>Save</Text>
          </Button>
          {this.state.initialGeofence && <Button danger onPress={this.deleteConfirm}>
            <Text style={styles.buttonText}>Delete</Text>
          </Button>}
        </View>
      </View>
    )
  }
}

interface MapGeofenceProps {
  geofence: GeofenceType,
  primary?: boolean,
}

const MapGeofence = ({ geofence, primary }: MapGeofenceProps) => (
  <Fragment>
    <Marker coordinate={geofence.coords} title={geofence.name} pinColor="red" opacity={primary ? 1 : 0.5} />
    <Circle center={geofence.coords} radius={geofence.radius} strokeColor={primary ? "white" : "rgba(255,255,255,0.25)"} fillColor={primary ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)"} />
  </Fragment>
)