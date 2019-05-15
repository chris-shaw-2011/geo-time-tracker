import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, ActivityIndicator, Button } from 'react-native';
import SQLite from 'react-native-sqlite-storage'
import Geofence from "./Classes/Geofence"
import { Header, Body, Title, Icon, Left, Right, Content } from "native-base"
import { createDrawerNavigator, createStackNavigator, createAppContainer, StackActions, NavigationActions, StackNavigator, DrawerNavigator, DrawerActions } from "react-navigation";
import Home from "./Components/Home"
import SideBar from './Components/SideBar';
import Geofences from './Components/Geofences';

SQLite.enablePromise(true);

interface Props {

}
interface State {
  geofences: Geofence[],
  loading: boolean,
}

const Drawer = createDrawerNavigator({
  Home: { screen: Home },
  Geofences: { screen: Geofences }
})
const DrawerStack = createStackNavigator(
  {
    Drawer: { screen: Drawer }
  },
  {
    headerMode: "none",
    navigationOptions: (props) => ({
      header: props => {

        console.log(props)
        return (<Header androidStatusBarColor="red" style={{ backgroundColor: "red" }}>
        <Left>
          <Icon name="menu" onPress={() => {
            props.navigation.dispatch(DrawerActions.toggleDrawer())
          }} style={{ color: "white" }} />
        </Left>
        <Body>
          <Title>Title</Title>
        </Body>
        <Right />
      </Header>)
      }
    })
  }
)

const PrimaryNavigator = createStackNavigator({
  LoggedIn: {
    screen: DrawerStack,
  },
},
  {
    headerMode: "float",
    initialRouteName: 'LoggedIn',
  });

const AppContainer = createAppContainer(PrimaryNavigator)

export default class App extends Component<Props, State> {
  readonly state: State = {
    geofences: [],
    loading: true,
  }
  async componentDidMount() {
    const db = await SQLite.openDatabase({
      name: "database",
      location: "default",
    });

    await db.executeSql(`
        CREATE TABLE IF NOT EXISTS geofences (name TEXT, latitude FLOAT, longitude FLOAT, radius FLOAT);
    `)

    const version = (await db.executeSql("PRAGMA user_version"))[0].rows.item(0).user_version as Number;

    if (version === 0) {
      await db.executeSql("PRAGMA user_version = 1")
    }

    this.setState({
      loading: false,
    })
  }

  render() {
    if (this.state.loading) {
      return (
        <View  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="red" /><Text>Loading</Text>
        </View>
      )
    }

    return (
      <AppContainer />
    )
  }
}