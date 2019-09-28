import React from "react"
import { Text, Button, ListItem, Left, Right, Icon } from "native-base";
import { Page } from "./Page";
import styles from "../Classes/Styles";
import { NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";
import Timecard from "../Classes/Timecard";
import moment from "moment"
import { Guid } from "guid-typescript";
import db from "../Classes/Database"
import Loading from "./Loading";
import GlobalEvents, { Event, GlobalEventListener } from "../Classes/GlobalEvents"
import { View, SectionListRenderItemInfo } from "react-native";
import GeolocationHelpers from "../Classes/GeolocationHelpers"
import DataSectionList from "./DateSectionList"

interface Props {
    navigation: NavigationScreenProp<NavigationState, NavigationParams>
}

interface State {
    timecards: Timecard[],
    loading: boolean,
    lastUpdate: Date,
    clockingIn: boolean,
    clockingOut: boolean,
}

export default class Timecards extends Page<Props, State> {
    title: string = "Timecards"
    updateInterval = 0
    updateTimeListener?: GlobalEventListener

    constructor(props: Props) {
        super(props)

        this.clockIn = this.clockIn.bind(this);
        this.clockOut = this.clockOut.bind(this);
        this.timeSelected = this.timeSelected.bind(this);
        this.loadFromDatabase = this.loadFromDatabase.bind(this);
        this.updateTime = this.updateTime.bind(this)

        this.state = {
            loading: true,
            timecards: [],
            lastUpdate: new Date(),
            clockingIn: false,
            clockingOut: false,
        }
    }

    async componentDidMount() {
        await this.loadFromDatabase();

        this.updateTimeListener = GlobalEvents.addListener(Event.TimecardUpdate, this.loadFromDatabase)

        this.updateInterval = setInterval(this.updateTime, 36000);
    }

    componentWillUnmount() {
        clearInterval(this.updateInterval)

        if (this.updateTimeListener) {
            this.updateTimeListener.remove();
        }
    }

    updateTime() {
        this.setState({
            lastUpdate: new Date(),
        })
    }

    async clockIn() {
        this.setState({
            clockingIn: true,
        })

        const id = Guid.create();

        await db.updateTimecard(new Timecard(id, new Date()))

        this.setState({
            clockingIn: false,
        })
    }

    async clockOut() {
        this.setState({
            clockingOut: true,
        })

        await Timecard.activeTimecard!.clockOut()

        this.setState({
            clockingOut: false,
        })
    }

    timeSelected(timecard: Timecard) {
        this.props.navigation.navigate("ViewTimecard", { timecard: timecard })
    }

    millisecondsToHours(milliseconds: number) {
        return Math.round(milliseconds / 10 / 60 / 60) / 100
    }

    async loadFromDatabase() {
        this.setState({
            loading: true,
        })

        const timecardRows = (await db.executeSql("SELECT rowid, id, timeIn, originalTimeIn, timeOut, originalTimeOut, description FROM timecard ORDER BY timeIn DESC"))[0].rows;

        this.setState({
            timecards: Timecard.fromDatabase(timecardRows),
            loading: false,
        })
    }

    render() {
        if (this.state.loading) {
            return <Loading />
        }

        return (
            <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column" }}>
                <DataSectionList items={this.state.timecards} getItemDate={(i) => i.timeIn} keyExtractor={i => i.id.toString()}
                    renderSectionHeaderAdditionalData={i => <Text>
                        {this.millisecondsToHours(i.data.reduce((total, t) => {
                            return total + (t.timeOut || new Date()).getTime() - t.timeIn.getTime()
                        }, 0))} hours
                        </Text>
                    }
                    renderItem={(args: SectionListRenderItemInfo<Timecard>) => {
                        const item = args.item
                        return (
                            <ListItem onPress={() => this.timeSelected(item)}>
                                <Left>
                                    <Text>
                                        {moment(item.timeIn).format("h:mm a")} - {item.timeOut ? moment(item.timeOut).format("h:mm a") : "?"}
                                    </Text>
                                </Left>
                                <Right>
                                    <View style={{ display: "flex", flexDirection: "row" }}>
                                        <Text style={{ paddingRight: 5 }}>
                                            {this.millisecondsToHours((item.timeOut || new Date()).getTime() - item.timeIn.getTime())} hours
                                        </Text>
                                        <Icon name="arrow-forward" />
                                    </View>
                                </Right>
                            </ListItem>
                        )
                    }} />
                {!Timecard.activeTimecard ?
                    <Button full primary light style={styles.button} onPress={this.clockIn} disabled={this.state.clockingIn}>
                        <Text style={styles.buttonText}>{this.state.clockingIn ? "Clocking In..." : "Clock In"}</Text>
                    </Button> :
                    <Button full primary light style={styles.button} onPress={this.clockOut} disabled={this.state.clockingOut}>
                        <Text style={styles.buttonText}>{this.state.clockingOut ? "Clocking Out..." : "Clock Out"}</Text>
                    </Button>}
            </View>
        )
    }
}