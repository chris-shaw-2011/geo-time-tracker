import React, { Fragment } from "react"
import { Text, Container, Content, Button, ListItem, Left, Right, Icon } from "native-base";
import { Page } from "./Page";
import styles from "../Classes/Styles";
import { NavigationScreenProp, NavigationState, NavigationParams, SectionList } from "react-navigation";
import Timecard from "../Classes/Timecard";
import moment from "moment"
import { Guid } from "guid-typescript";
import db from "../Classes/Database"
import Loading from "./Loading";
import GlobalEvents, { Event, GlobalEventListener } from "../Classes/GlobalEvents"
import { View, StyleSheet } from "react-native";

interface Props {
    navigation: NavigationScreenProp<NavigationState, NavigationParams>
}

interface State {
    sections: Section[],
    loading: boolean,
    lastUpdate: Date,
}

interface Section {
    title: String,
    data: Timecard[],
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
            sections: [],
            lastUpdate: new Date(),
        }
    }

    async componentDidMount() {
        await this.loadFromDatabase();

        this.updateTimeListener = GlobalEvents.addListener(Event.TimeCardUpdate, this.loadFromDatabase)

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

    clockIn() {
        db.updateTimecard(new Timecard(Guid.create(), new Date()))
    }

    clockOut() {
        Timecard.activeTimecard!.clockOut()
    }

    timeSelected(timecard: Timecard) {

    }

    millisecondsToHours(milliseconds: number) {
        return Math.round(milliseconds / 10 / 60 / 60) / 100
    }

    async loadFromDatabase() {
        this.setState({
            loading: true,
        })

        const timecardRows = (await db.executeSql("SELECT rowid, id, timeIn, originalTimeIn, timeOut, originalTimeOut, description FROM timecard ORDER BY timeIn DESC"))[0].rows;
        var sections: Section[] = [];
        const timecards = Timecard.fromDatabase(timecardRows);

        timecards.forEach(t => {
            const title = moment(t.timeIn).format("MMMM Do YYYY");
            var section: Section

            if (sections.length == 0 || sections[sections.length - 1].title != title) {
                section = {
                    title: title,
                    data: []
                }
                sections.push(section)
            }
            else {
                section = sections[sections.length - 1]
            }

            section.data.push(t)
        })

        this.setState({
            sections: sections,
            loading: false,
        })
    }

    render() {
        if (this.state.loading) {
            return <Loading />
        }

        return (
            <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column" }}>
                <SectionList sections={this.state.sections} stickySectionHeadersEnabled={true}
                    keyExtractor={(item) => (item as Timecard).id.toString()}
                    renderSectionHeader={({ section }) => {
                        const data = section.data as Timecard[]

                        return (
                            <View style={{backgroundColor: "grey", alignItems: "center"}}>
                                <Text style={{ fontWeight: 'bold' }}>{section.title}</Text>
                                <Text>
                                    {this.millisecondsToHours(data.reduce((total, t) => {
                                        return total + (t.timeOut || new Date()).getTime() - t.timeIn.getTime()
                                    }, 0))} hours
                                </Text>
                            </View>
                        )
                    }}
                    renderItem={(args) => {
                        const item: Timecard = args.item
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
                    <Button full primary light style={styles.button} onPress={this.clockIn}>
                        <Text style={styles.buttonText}>Clock In</Text>
                    </Button> :
                    <Button full primary light style={styles.button} onPress={this.clockOut}>
                        <Text style={styles.buttonText}>Clock Out</Text>
                    </Button>}
            </View>
        )
    }
}