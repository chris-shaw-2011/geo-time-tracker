import React, { Component } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import SQLite from 'react-native-sqlite-storage'
import Geofence from "./Classes/Geofence"
import AppContainer from "./Components/AppContainer"
import GlobalSettingsContext from './Classes/GlobalSettingsContext';
import GlobalSettings from './Classes/GlobalSettings';
import styles from './Classes/Styles';
import AsyncStorage from '@react-native-community/async-storage';

interface Props {

}
interface State {
  geofences: Geofence[],
  loading: boolean,
  loggedInInitially: boolean,
  globalSettings: GlobalSettings
}

export default class App extends Component<Props, State> {
  readonly state: State = {
    geofences: [],
    loading: true,
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
        loading: false,
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
        globalSettings: new GlobalSettings({
          username: username,
          token: token,
          defaultGlobalSettings: globalSettings,
        })
      }
    })
  }

  async logOut() {
    await AsyncStorage.removeItem("username");
    await AsyncStorage.removeItem("token");

    this.setState(({globalSettings}) => {
      return {
        globalSettings: new GlobalSettings({
          token: "",
          defaultGlobalSettings: globalSettings,
        })
      }
    })
  }

  render() {
    if (this.state.loading) {
      return (
        <View style={styles.loadingView}>
          <ActivityIndicator color="red" /><Text>Loading</Text>
        </View>
      )
    }

    return (
      <GlobalSettingsContext.Provider value={this.state.globalSettings}>
        <AppContainer isLoggedInInitially={this.state.loggedInInitially} />
      </GlobalSettingsContext.Provider>
    )
  }
}