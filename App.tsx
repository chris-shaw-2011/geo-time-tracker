import React, { Component } from 'react';
import SQLite from 'react-native-sqlite-storage'
import Geofence from "./Classes/Geofence"
import AppContainer from "./Components/AppContainer"
import GlobalSettingsContext from './Classes/GlobalSettingsContext';
import GlobalSettings from './Classes/GlobalSettings';
import AsyncStorage from '@react-native-community/async-storage';
import { AppStatus } from "./Classes/Enumerations";
import Timecard, { ActiveTimecard } from './Classes/Timecard';
import PushNotification from "react-native-push-notification"
import { DeviceEventEmitter } from 'react-native';
import moment from "moment"
import db from "./Classes/Database"
import GlobalEvents, { Event } from "./Classes/GlobalEvents"

PushNotification.configure({

    // (optional) Called when Token is generated (iOS and Android)
    onRegister: function (token) {
        console.log('TOKEN:', token);
    },

    // (required) Called when a remote or local notification is opened or received
    onNotification: function (notification) {

        if(notification.action == "Clock Out") {
            Timecard.activeTimecard!.clockOut()
        }

        // process the notification

        // required on iOS only (see fetchCompletionHandler docs: https://facebook.github.io/react-native/docs/pushnotificationios.html)
        //        notification.finish(PushNotificationIOS.FetchResult.NoData);
    },

    // ANDROID ONLY: GCM or FCM Sender ID (product_number) (optional - not required for local notifications, but is need to receive remote push notifications)
    //senderID: "YOUR GCM (OR FCM) SENDER ID",

    // IOS ONLY (optional): default: all - Permissions to register.
    permissions: {
        alert: true,
        badge: true,
        sound: true
    },

    // Should the initial notification be popped automatically
    // default: true
    popInitialNotification: true,

    /**
      * (optional) default: true
      * - Specified if permissions (ios) and token (android and ios) will requested or not,
      * - if not, you must call PushNotificationsHandler.requestPermissions() later
      */
    requestPermissions: true,
});

interface Props {

}
interface State {
    geofences: Geofence[],
    appStatus: AppStatus,
    loggedInInitially: boolean,
    globalSettings: GlobalSettings,
}

export default class App extends Component<Props, State> {
    readonly state: State = {
        geofences: [],
        appStatus: AppStatus.Loading,
        loggedInInitially: false,
        globalSettings: new GlobalSettings({
            defaultGlobalSettings: undefined,
        }),
    }

    constructor(props: Props) {
        super(props);

        this.logIn = this.logIn.bind(this);
        this.logOut = this.logOut.bind(this);
        this.updateGeofence = this.updateGeofence.bind(this);
        this.setTitle = this.setTitle.bind(this);
        this.notificationAction = this.notificationAction.bind(this);

        PushNotification.registerNotificationActions(['Clock Out']);

        DeviceEventEmitter.addListener('notificationActionReceived', this.notificationAction);
    }

    async componentDidMount() {
        SQLite.enablePromise(true);

        await this.loadInitialData()
    }

    async loadInitialData() {
        var username = await AsyncStorage.getItem("username") || "";
        var token = await AsyncStorage.getItem("token") || "";
        var geofences = await this.loadGeofencesFromDb();
        const activeTimecard = Timecard.fromDatabase((await db.executeSql("SELECT *, rowid FROM timecard WHERE timeOut is null"))[0].rows).pop();

        Timecard.activeTimecard = activeTimecard ? new ActiveTimecard(activeTimecard) : undefined;

        //        setTimeout(() => {
        this.setState(({ globalSettings }) => {
            return {
                appStatus: token && username ? AppStatus.LoggedIn : AppStatus.NotLoggedIn,
                globalSettings: new GlobalSettings({
                    username: username,
                    token: token,
                    logInSuccessful: this.logIn,
                    logOut: this.logOut,
                    defaultGlobalSettings: globalSettings,
                    geofences: geofences,
                    updateGeofence: this.updateGeofence,
                    setTitle: this.setTitle,
                })
            }
        })
        //    }, 10000)
    }

    async logIn(username: string, token: string) {
        await AsyncStorage.setItem("username", username);
        await AsyncStorage.setItem("token", token);

        this.setState(({ globalSettings }) => {
            return {
                appStatus: AppStatus.LoggedIn,
                globalSettings: new GlobalSettings({
                    username: username,
                    token: token,
                    defaultGlobalSettings: globalSettings,
                })
            }
        })
    }

    async logOut() {
        await AsyncStorage.removeItem("token");

        this.setState(({ globalSettings }) => {
            return {
                appStatus: AppStatus.NotLoggedIn,
                globalSettings: new GlobalSettings({
                    token: "",
                    defaultGlobalSettings: globalSettings,
                })
            }
        })
    }

    async updateGeofence(newGeofence?: Geofence, originalName?: string) {
        var sql: string;
        var params: any[];

        if (newGeofence) {
            params = [newGeofence.name, newGeofence.coords.latitude, newGeofence.coords.longitude, newGeofence.radius]

            if (originalName) {
                sql = "UPDATE geofence SET name = ?, latitude = ?, longitude = ?, radius = ? WHERE name = ?"
                params.push(originalName);
            }
            else {
                sql = "INSERT INTO geofence (name, latitude, longitude, radius) VALUES(?, ?, ?, ?)"
            }
        }
        else {
            sql = "DELETE FROM geofence WHERE name = ?"
            params = [originalName]
        }

        await db.executeSql(sql, params);

        const geofences = await this.loadGeofencesFromDb();

        this.setState(({ globalSettings }) => {
            return {
                globalSettings: new GlobalSettings({
                    geofences: geofences,
                    defaultGlobalSettings: globalSettings,
                })
            }
        })
    }

    async loadGeofencesFromDb() {
        var geofenceRows = (await db.executeSql("SELECT name, latitude, longitude, radius FROM geofence ORDER BY name"))[0].rows;
        var geofences = new Array<Geofence>()

        for (var i = 0; i < geofenceRows.length; ++i) {
            var item = geofenceRows.item(i);

            geofences.push(new Geofence(item.name, { latitude: item.latitude, longitude: item.longitude }, item.radius))
        }

        return geofences;
    }

    setTitle(title: string) {
        this.setState(({ globalSettings }) => {
            return {
                globalSettings: new GlobalSettings({
                    title: title,
                    defaultGlobalSettings: globalSettings,
                })
            }
        })
    }

    notificationAction(action: any) {
        console.log('Notification action received: ' + action);
        const info = JSON.parse(action.dataJSON);
        if (info.action == 'Clock Out') {
            // Do work pertaining to Accept action here
        }
    }

    render() {
        return (
            <GlobalSettingsContext.Provider value={this.state.globalSettings}>
                <AppContainer appStatus={this.state.appStatus} />
            </GlobalSettingsContext.Provider>
        )
    }
}