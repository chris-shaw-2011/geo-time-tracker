import React, { Fragment } from "react"
import { Page } from "./Page";
import Timecard, { TimecardEvent } from "../Classes/Timecard";
import moment from "moment";
import db from "../Classes/Database";
import { Guid } from "guid-typescript";
import Loading from "./Loading";
import { View, ListItem, Text } from "native-base";
import MapView, { Marker, Circle, Polygon, LatLng, Polyline } from "react-native-maps";
import GlobalSettingsContext from "../Classes/GlobalSettingsContext";
import MapGeofence from "./MapGeofence";
import { StyleSheet } from "react-native";
import { NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";
import GlobalEvents, { GlobalEventListener, Event } from "../Classes/GlobalEvents";
import DateSectionList from "./DateSectionList";

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
    events: TimecardEvent[],
    loading: boolean,
    selectedEventId?: Guid,
}

export default class ViewTimecard extends Page<Props, State> {
    map: MapView | null = null;
    title = "";
    updateTimecardCoordinatesListener?: GlobalEventListener
    updateTimecardListener?: GlobalEventListener
    hasScrolled = false

    constructor(props: Props) {
        super(props)

        const timecard = props.navigation.getParam("timecard") as Timecard

        this.state = {
            timecard: timecard,
            events: new Array<TimecardEvent>(),
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
        var rows = (await db.executeSql("SELECT id, latitude, longitude, accuracy, time, message FROM timecardEvent WHERE timecardId = ? ORDER BY time DESC", [timecard.id]))[0].rows;
        var events = new Array<TimecardEvent>();

        for (var i = 0; i < rows.length; ++i) {
            const row = rows.item(i);
            events.push({
                id: Guid.parse(row.id),
                coordinate: row.latitude && row.longitude ? {
                    latitude: row.latitude,
                    longitude: row.longitude,
                } : undefined,
                accuracy: row.accuracy,
                time: new Date(row.time * 1000),
                message: row.message,
            })
        }

        this.updateTitle(timecard);

        this.setState({
            timecard: timecard,
            events: events,
            loading: false,
        })
    }

    updateTitle(timecard: Timecard) {
        var newTitle = moment(timecard.timeIn).format("M/D/YY h:mm a") + " - ";

        if (timecard.timeOut) {
            if (moment(timecard.timeIn).format("M/D/YY") == moment(timecard.timeOut).format("M/D/YY")) {
                newTitle += moment(timecard.timeOut).format("h:mm a")
            }
            else {
                newTitle += moment(timecard.timeOut).format("M/D/YY h:mm a");
            }
        }
        else {
            newTitle += "?";
        }

        this.title = newTitle;
        this.context.setTitle(newTitle);
    }

    eventPressed(event: TimecardEvent) {
        if (this.map && event.coordinate) {
            this.setState({
                selectedEventId: event.id,
            })
            this.map.fitToCoordinates(event.accuracy ? this.get4PointsAroundCircumference(event.coordinate, event.accuracy) : [event.coordinate], { animated: true })
        }
    }

    get4PointsAroundCircumference(latLng: LatLng, radius: number): LatLng[] {
        const earthRadius = 6378.1 * 1000;
        const lat0 = latLng.latitude + (-radius / earthRadius) * (180 / Math.PI)
        const lat1 = latLng.latitude + (radius / earthRadius) * (180 / Math.PI)
        const lng0 = latLng.longitude + (-radius / earthRadius) * (180 / Math.PI) / Math.cos(latLng.latitude * Math.PI / 180);
        const lng1 = latLng.longitude + (radius / earthRadius) * (180 / Math.PI) / Math.cos(latLng.latitude * Math.PI / 180);

        return [{
            latitude: lat0,
            longitude: latLng.longitude
        }, //bottom
        {
            latitude: latLng.latitude,
            longitude: lng0
        }, //left
        {
            latitude: lat1,
            longitude: latLng.longitude
        }, //top
        {
            latitude: latLng.latitude,
            longitude: lng1
        } //right
        ]
    }

    render() {
        if (this.state.loading) {
            return <Loading />
        }

        const eventsWithCoords = this.state.events.filter(e => e.coordinate);

        return (
            <View style={styles.fill}>
                <MapView
                    style={{ height: "100%", flexGrow: 1, flexShrink: 1 }}
                    ref={ref => this.map = ref}
                    mapType="satellite"
                    onMapReady={() => this.map && eventsWithCoords.length && this.map.fitToCoordinates(eventsWithCoords.map(t => t.coordinate!))}
                >
                    <GlobalSettingsContext.Consumer>
                        {value =>
                            <Fragment>
                                {value.geofences.map(g => <MapGeofence geofence={g} key={g.name} primary={true} />)}
                            </Fragment>
                        }
                    </GlobalSettingsContext.Consumer>
                    {eventsWithCoords.map((e, index) => {
                        const selected = e.id == this.state.selectedEventId
                        const nextSelected = index + 1 != eventsWithCoords.length && eventsWithCoords[index + 1].id == this.state.selectedEventId;
                        var lineCoordinates: LatLng[] = []

                        lineCoordinates.push(e.coordinate!)

                        if (index + 1 != eventsWithCoords.length) {
                            lineCoordinates.push(eventsWithCoords[index + 1].coordinate!)
                        }

                        return (
                            <Fragment key={`${e.id.toString()}${selected ? "selected" : ""}`}>
                                {lineCoordinates.length > 1 && <Polyline coordinates={lineCoordinates} strokeColor={selected || nextSelected ? "red" : "blue"} strokeWidth={selected || nextSelected ? 6 : 2} />}
                                <Marker coordinate={e.coordinate!} title={moment(e.time).format("MMMM Do YYYY h:mm a")} pinColor={selected ? "red" : "blue"} onPress={() => this.eventPressed(e)} />
                                {e.accuracy && selected && <Circle center={e.coordinate!} radius={e.accuracy} fillColor="rgba(255, 0, 0, .25)" strokeColor="red" />}
                            </Fragment>
                        )
                    })}
                </MapView>
                <DateSectionList style={{ height: 200 }} items={this.state.events} keyExtractor={i => i.id ? i.id.toString() : ""} getItemDate={i => i.time} onViewableItemsChanged={e => this.hasScrolled && e.viewableItems[0].item.coordinate && this.eventPressed(e.viewableItems[0].item as TimecardEvent)} viewabilityConfig={{ itemVisiblePercentThreshold: 15 }} onScroll={() => this.hasScrolled = true}
                    renderItem={({ item }) => (
                        <ListItem onPress={(e) => this.eventPressed(item)}>
                            <Text>{`${moment(item.time).format("h:mm a")} ${item.message ? `- ${item.message}` : ""}`}</Text>
                        </ListItem>
                    )}
                />
            </View>
        )
    }
}