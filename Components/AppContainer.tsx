import React from 'react';
import { Header, Body, Title, Icon, Left, Right } from "native-base"
import { createDrawerNavigator, createStackNavigator, createAppContainer, DrawerActions, NavigationContainer, DrawerItems } from "react-navigation";
import Home from "./Home"
import Geofences from './Geofences';
import LogIn from './LogIn';
import styles from "../Classes/Styles";
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, Text, View } from 'react-native';
import GlobalSettingsContext from '../Classes/GlobalSettingsContext';
import Settings from './Settings';

interface Props {
    isLoggedInInitially: boolean
}

const Drawer = createDrawerNavigator({
    Home: { screen: Home },
    Geofences: { screen: Geofences },
    Settings: { screen: Settings},
},
    {
        contentComponent: props => (
            <ScrollView>
                <SafeAreaView>
                    <GlobalSettingsContext.Consumer>
                        {value => 
                            <View style={{flex: 1, flexDirection: "row", padding: 10, justifyContent: "center"}}>
                                <Text style={{flexGrow: 1, flex: 1, justifyContent: "center", textAlignVertical: "center"}}>{value.username}</Text>
                                <Icon style={{textAlignVertical: "center"}} name="settings" onPress={() => props.navigation.navigate("Settings")} />
                            </View>
                        }
                    </GlobalSettingsContext.Consumer>
                    <DrawerItems {...props} />
                </SafeAreaView>
            </ScrollView>
        )
    })

const DrawerStack = createStackNavigator({
    Drawer: { screen: Drawer }
},
    {
        headerMode: "none",
        navigationOptions: () => ({
            header: props => {
                var drawerRoute = props.scene.route.routes[props.scene.route.index];
                var visibleScene = Drawer.router.getComponentForRouteName(drawerRoute.routes[drawerRoute.index].key);

                return (
                    <Header androidStatusBarColor="red" style={styles.header}>
                        <Left>
                            <Icon name="menu" onPress={() => props.navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.menu} />
                        </Left>
                        <Body>
                            <Title style={styles.title}>{visibleScene.navigationOptions.title}</Title>
                        </Body>
                        <Right />
                    </Header>)
            }
        })
    }
)

const MainStackScreens = {
    LoggedIn: {
        screen: DrawerStack,
    },
    NotLoggedIn: {
        screen: LogIn,
    }
}

const StackNavigatorLoggedIn = createStackNavigator(MainStackScreens,
    {
        headerMode: "float",
        initialRouteName: 'LoggedIn',
    });

const StackNavigationNotLoggedIn = createStackNavigator(MainStackScreens,
    {
        headerMode: "float",
        initialRouteName: 'NotLoggedIn',
    });

export default class AppContainer extends React.Component<Props> {
    readonly appContainer: NavigationContainer

    constructor(props: Props) {
        super(props)
        this.appContainer = props.isLoggedInInitially ? createAppContainer(StackNavigatorLoggedIn) : createAppContainer(StackNavigationNotLoggedIn)
    }

    render() {
        return (
            <this.appContainer />
        )
    }
}