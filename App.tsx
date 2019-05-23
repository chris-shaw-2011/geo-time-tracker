import React, { Component } from 'react';
import SQLite from 'react-native-sqlite-storage'
import Geofence from "./Classes/Geofence"
import AppContainer from "./Components/AppContainer"
import GlobalSettingsContext from './Classes/GlobalSettingsContext';
import GlobalSettings from './Classes/GlobalSettings';
import AsyncStorage from '@react-native-community/async-storage';
import { AppStatus } from "./Classes/Enumerations";

interface Props {

}
interface State {
    geofences: Geofence[],
    appStatus: AppStatus,
    loggedInInitially: boolean,
    globalSettings: GlobalSettings
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
    }

    async componentDidMount() {
        SQLite.enablePromise(true);

        const db = await SQLite.openDatabase({
            name: "database",
            location: "default",
        })
        var username = "";
        var token = "";

        await db.executeSql(`
            CREATE TABLE IF NOT EXISTS geofences (name TEXT PRIMARY KEY, latitude FLOAT, longitude FLOAT, radius FLOAT);
        `)

        const version = (await db.executeSql("PRAGMA user_version"))[0].rows.item(0).user_version as Number;

        if (version === 0) {
            await db.executeSql("PRAGMA user_version = 1")
        }

        username = await AsyncStorage.getItem("username") || ""
        token = await AsyncStorage.getItem("token") || ""

        this.setState(({ globalSettings }) => {
            return {
                appStatus: token && username ? AppStatus.LoggedIn : AppStatus.NotLoggedIn,
                globalSettings: new GlobalSettings({
                    username: username,
                    token: token,
                    db: db,
                    logInSuccessful: this.logIn,
                    logOut: this.logOut,
                    defaultGlobalSettings: globalSettings
                })
            }
        })
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

    render() {
        return (
            <GlobalSettingsContext.Provider value={this.state.globalSettings}>
                <AppContainer appStatus={this.state.appStatus} />
            </GlobalSettingsContext.Provider>
        )
    }
}