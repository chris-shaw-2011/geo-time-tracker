import React, { PureComponent } from "react"
import { Page } from "./Page";
import { Right, Text, Left, ListItem, Item, Icon, View } from "native-base";
import db from "../Classes/Database";
import moment from "moment";
import GlobalEvents, { Event, GlobalEventListener } from "../Classes/GlobalEvents";
import { NavigationParams, NavigationState, NavigationScreenProp, NavigationEventSubscription } from "react-navigation";
import DateSectionList from "./DateSectionList";
import { Animated, LayoutChangeEvent } from "react-native";

interface Log {
    message: String,
    time: Date,
    rowid: number,
    data?: string,
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
                data: item.data,
            })
        }

        this.setState({
            logs: logs,
        })
    }

    render() {
        return (
            <DateSectionList items={this.state.logs} getItemDate={i => i.time} keyExtractor={i => i.rowid.toString()}
                renderItem={i => <LogRow log={i.item} />} />
        )
    }
}

interface LogRowProps {
    log: Log,
}

interface LogRowState {
    dataVisible: boolean,
    rowHeight?: Animated.Value | number,
    titleHeight: number,
}

class LogRow extends PureComponent<LogRowProps, LogRowState> {
    state: LogRowState = {
        dataVisible: false,
        titleHeight: 0,
    }
    maxDataHeight: number = 0

    constructor(props: LogRowProps) {
        super(props)

        this.dataLayout = this.dataLayout.bind(this);
        this.titleLayout = this.titleLayout.bind(this);
        this.titleTouchEnd = this.titleTouchEnd.bind(this);
    }

    titleTouchEnd() {
        var finalValue: number;

        this.setState(prev => {
            const initialValue = prev.dataVisible ? this.maxDataHeight + prev.titleHeight : prev.titleHeight

            finalValue = prev.dataVisible ? prev.titleHeight : this.maxDataHeight + prev.titleHeight;

            return {
                dataVisible: !prev.dataVisible,
                rowHeight: new Animated.Value(initialValue),
            }
        }, () => Animated.spring(
            this.state.rowHeight as Animated.Value,
            {
                toValue: finalValue
            }
        ).start())
    }

    titleLayout(e: LayoutChangeEvent) {
        this.setState({ titleHeight: e.nativeEvent.layout.height, rowHeight: e.nativeEvent.layout.height })
    }

    dataLayout(e: LayoutChangeEvent) {
        this.maxDataHeight = e.nativeEvent.layout.height;
    }

    render() {
        const log = this.props.log;

        return (
            <ListItem style={{ display: "flex", width: "100%", flexDirection: "column", overflow: "hidden" }}>
                <Animated.View style={{ display: "flex", width: "100%", flexDirection: "column", height: this.state.rowHeight, overflow: "hidden" }}>
                    <View onTouchEnd={this.titleTouchEnd} style={{ display: "flex", width: "100%", flexDirection: "row", flexShrink: 0, flexGrow: 0 }} onLayout={this.titleLayout}>
                        <View style={{ flexGrow: 1, flexShrink: 1 }}>
                            <Text>{log.message}</Text>
                        </View>
                        <View style={{ flexGrow: 0, flexShrink: 0, paddingLeft: 10, paddingRight: 10 }}>
                            <Text>{moment(log.time).format("h:mm:ss a")}</Text>
                        </View>
                        {log.data && <View style={{ flexGrow: 0, flexShrink: 0, paddingRight: 10 }}>
                            <Icon name={!this.state.dataVisible ? "chevron-thin-down" : "chevron-thin-up"} type="Entypo" />
                        </View>}
                    </View>
                    {log.data && this.state.rowHeight && <View onLayout={this.dataLayout} style={{ flexGrow: 0, flexShrink: 0 }}>
                        <Text>{log.data}</Text>
                    </View>}
                </Animated.View>
            </ListItem>
        )
    }
}