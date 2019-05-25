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
        this.updateGeofence = this.updateGeofence.bind(this);
        this.setTitle = this.setTitle.bind(this);
    }

    async componentDidMount() {
        SQLite.enablePromise(true);

        const db = await SQLite.openDatabase({
            name: "database",
            location: "default",
        })

        await db.executeSql(`
            CREATE TABLE IF NOT EXISTS geofence (name TEXT PRIMARY KEY, latitude FLOAT, longitude FLOAT, radius FLOAT);
        `)

        const version = (await db.executeSql("PRAGMA user_version"))[0].rows.item(0).user_version as Number;

        if (version === 0) {
            await db.executeSql("PRAGMA user_version = 1")
        }

        await this.loadInitialData(db)
    }

    async loadInitialData(db: SQLite.SQLiteDatabase) {
        var username = await AsyncStorage.getItem("username") || "";
        var token = await AsyncStorage.getItem("token") || "";
        var geofences = await this.loadGeofencesFromDb(db);

        this.setState(({ globalSettings }) => {
            return {
                appStatus: token && username ? AppStatus.LoggedIn : AppStatus.NotLoggedIn,
                globalSettings: new GlobalSettings({
                    username: username,
                    token: token,
                    db: db,
                    logInSuccessful: this.logIn,
                    logOut: this.logOut,
                    defaultGlobalSettings: globalSettings,
                    geofences: geofences,
                    updateGeofence: this.updateGeofence,
                    setTitle: this.setTitle,
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

    async updateGeofence(newGeofence?: Geofence, originalName?: string) {
        const db = this.state.globalSettings.db;
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

        const geofences = await this.loadGeofencesFromDb(db);

        this.setState(({ globalSettings }) => {
            return {
                appStatus: AppStatus.LoggedIn,
                globalSettings: new GlobalSettings({
                    geofences: geofences,
                    defaultGlobalSettings: globalSettings,
                })
            }
        })
    }

    async loadGeofencesFromDb(db:SQLite.SQLiteDatabase) {
        var geofenceRows = (await db.executeSql("SELECT name, latitude, longitude, radius FROM geofence ORDER BY name"))[0].rows;
        var geofences = new Array<Geofence>()

        for (var i = 0; i < geofenceRows.length; ++i) {
            var item = geofenceRows.item(i);

            geofences.push(new Geofence(item.name, { latitude: item.latitude, longitude: item.longitude }, item.radius))
        }

        return geofences;
    }

    setTitle(title:string) {
        this.setState(({ globalSettings }) => {
            return {
                appStatus: AppStatus.LoggedIn,
                globalSettings: new GlobalSettings({
                    title: title,
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