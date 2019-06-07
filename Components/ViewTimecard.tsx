import React, { Fragment } from "react"
import { Page } from "./Page";
import Timecard, { TimecardCoordinate } from "../Classes/Timecard";
import moment from "moment";
import db from "../Classes/Database";
import { Guid } from "guid-typescript";
import Loading from "./Loading";
import { View, ListItem, Text } from "native-base";
import MapView, { Marker } from "react-native-maps";
import GlobalSettingsContext from "../Classes/GlobalSettingsContext";
import MapGeofence from "./MapGeofence";
import { StyleSheet, FlatList } from "react-native";
import { NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";
import GlobalEvents, { GlobalEventListener, Event } from "../Classes/GlobalEvents";

const styles = StyleSheet.create({
    fill: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
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
    timecard: Timecard,
    coordinates: TimecardCoordinate[],
    loading: boolean,
}

export default class ViewTimecard extends Page<Props, State> {
    map: MapView | null = null;
    title = "";
    updateTimecardCoordinatesListener?: GlobalEventListener
    updateTimecardListener?: GlobalEventListener

    constructor(props: Props) {
        super(props)

        const timecard = props.navigation.getParam("timecard") as Timecard

        this.state = {
            timecard: timecard,
            coordinates: new Array<TimecardCoordinate>(),
            loading: true,
        }
        this.updateTimecard = this.updateTimecard.bind(this);
    }

    async componentDidMount() {
        await this.updateTimecard()

        this.updateTimecardListener = GlobalEvents.addListener(Event.TimecardUpdate, this.updateTimecard)
        this.updateTimecardCoordinatesListener = GlobalEvents.addListener(Event.TimecardCoordinateAdded, this.updateTimecard);
    }

    componentWillUnmount() {
        if (this.updateTimecardListener) {
            this.updateTimecardListener.remove();
        }

        if (this.updateTimecardCoordinatesListener) {
            this.updateTimecardCoordinatesListener.remove();
        }
    }

    async updateTimecard() {
        var timecard = Timecard.fromDatabase((await db.executeSql("SELECT *, rowid from timecard where id = ?", [this.state.timecard.id.toString()]))[0].rows).pop()!;
        var rows = (await db.executeSql("SELECT id, latitude, longitude, accuracy, time FROM timecardCoordinate WHERE timecardId = ? ORDER BY time DESC", [timecard.id]))[0].rows;
        var coordinates = new Array<TimecardCoordinate>();

        for (var i = 0; i < rows.length; ++i) {
            const row = rows.item(i);
            coordinates.push({
                id: Guid.parse(row.id),
                coordinate: {
                    latitude: row.latitude,
                    longitude: row.longitude,
                },
                accuracy: row.accuracy,
                time: new Date(row.time * 1000),
            })
        }

        this.updateTitle(timecard);

        this.setState({
            timecard: timecard,
            coordinates: coordinates,
            loading: false,
        })
    }

    updateTitle(timecard: Timecard) {
        var newTitle = moment(timecard.timeIn).format("M/D/YY hh:mm a") + " - ";

        if (timecard.timeOut) {
            if (moment(timecard.timeIn).format("M/D/YY") == moment(timecard.timeOut).format("M/D/YY")) {
                newTitle += moment(timecard.timeOut).format("hh:mm a")
            }
            else {
                newTitle += moment(timecard.timeOut).format("M/D/YY hh:mm a");
            }
        }
        else {
            newTitle += "?";
        }

        this.title = newTitle;
        this.context.setTitle(newTitle);
    }

    render() {
        if (this.state.loading) {
            return <Loading />
        }

        return (
            <View style={styles.fill}>
                <MapView
                    style={{ height: "100%", flexGrow: 1, flexShrink: 1 }}
                    ref={ref => this.map = ref}
                    mapType="satellite"
                    onMapReady={() => this.map && this.map.fitToCoordinates(this.state.coordinates.map(t => t.coordinate))}
                >
                    <GlobalSettingsContext.Consumer>
                        {value =>
                            <Fragment>
                                {value.geofences.map(g => <MapGeofence geofence={g} key={g.name} primary={true} />)}
                            </Fragment>
                        }
                    </GlobalSettingsContext.Consumer>
                    {this.state.coordinates.map(c => <Marker coordinate={c.coordinate} title={moment(c.time).format("MMMM Do YYYY hh:mm a")} pinColor="blue" key={c.id.toString()} />)}
                </MapView>
                <FlatList style={{ height: 150 }} data={this.state.coordinates} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
                    <ListItem onPress={() => this.map && this.map.fitToCoordinates([item.coordinate], {animated: true})}>
                        <Text>{moment(item.time).format("MMMM Do YYYY hh:mm a")}</Text>
                    </ListItem>
                )} />
            </View>

        )
    }
}