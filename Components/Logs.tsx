import React from "react"
import { Page } from "./Page";
import { Right, Text, Left, ListItem, Item } from "native-base";
import db from "../Classes/Database";
import { ListRenderItemInfo, FlatList } from "react-native";
import moment from "moment";
import GlobalEvents, { Event, GlobalEventListener } from "../Classes/GlobalEvents";
import { NavigationParams, NavigationState, NavigationScreenProp, NavigationEventSubscription } from "react-navigation";

interface Log {
    message: String,
    time: Date,
    rowid: number,
}

interface State {
    logs: Log[]
}

interface Props {
    navigation: NavigationScreenProp<NavigationState, NavigationParams>
}

export default class Logs extends Page<Props, State> {
    title = "Logs"
    state = {
        logs: new Array<Log>(),
    }
    logAddedListener?: GlobalEventListener
    focusListener?: NavigationEventSubscription

    constructor(props: Props) {
        super(props);

        this.updateLogs = this.updateLogs.bind(this);
    }

    async componentDidMount() {
        await this.updateLogs();

        this.logAddedListener = GlobalEvents.addListener(Event.LogAdded, this.updateLogs)
        this.focusListener = this.props.navigation.addListener("willFocus", this.updateLogs)
    }

    componentWillUnmount() {
        if (this.logAddedListener) {
            this.logAddedListener.remove();
        }

        if (this.focusListener) {
            this.focusListener.remove();
        }
    }

    async updateLogs() {
        const rows = (await db.executeSql("SELECT *, rowid FROM log ORDER BY time DESC"))[0].rows;
        var logs = new Array<Log>();

        for (var i = 0; i < rows.length; ++i) {
            const item = rows.item(i);
            logs.push({
                message: item.message,
                time: new Date(item.time * 1000),
                rowid: item.rowid,
            })
        }

        this.setState({
            logs: logs,
        })
    }

    render() {
        return (
            <FlatList data={this.state.logs} keyExtractor={i => i.rowid.toString()} renderItem={itemInfo => (
                <ListItem>
                    <Left>
                        <Text>{itemInfo.item.message}</Text>
                    </Left>
                    <Right>
                        <Text>{moment(itemInfo.item.time).format("M/D/YY hh:mm:ss a")}</Text>
                    </Right>
                </ListItem>
            )} />

        )
    }
}