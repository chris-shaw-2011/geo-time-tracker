import React from 'react';
import { Header, Body, Title, Icon, Left, Right } from "native-base"
import { createDrawerNavigator, createStackNavigator, createAppContainer, DrawerActions, NavigationContainer, DrawerItems, createSwitchNavigator, NavigationContainerComponent, NavigationActions } from "react-navigation";
import Home from "./Home"
import Geofences from './Geofences';
import LogIn from './LogIn';
import styles, { defaultColor } from "../Classes/Styles";
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, Text, View, ActivityIndicator } from 'react-native';
import GlobalSettingsContext from '../Classes/GlobalSettingsContext';
import Settings from './Settings';
import { AppStatus } from '../Classes/Enumerations';
import Loading from './Loading';

interface Props {
    appStatus: AppStatus,
}

const Drawer = createDrawerNavigator({
    Home: { screen: Home },
    Geofences: { screen: Geofences },
    Settings: { screen: Settings },
},
    {
        contentComponent: props => (
            <ScrollView>
                <SafeAreaView>
                    <GlobalSettingsContext.Consumer>
                        {value =>
                            <View style={{ flex: 1, flexDirection: "row", padding: 10, justifyContent: "center" }}>
                                <Text style={{ flexGrow: 1, flex: 1, justifyContent: "center", textAlignVertical: "center" }}>{value.username}</Text>
                                <Icon style={{ textAlignVertical: "center" }} name="settings" onPress={() => props.navigation.navigate("Settings")} />
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
                    <Header androidStatusBarColor={defaultColor} style={styles.header}>
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

const LoggedIn = createStackNavigator({
    DrawerStackScreen: {
        screen: DrawerStack,
    }
},
    {
        headerMode: "float",
    });

const NotLoggedIn = createStackNavigator({
    LogInScreen: {
        screen: LogIn,
    }
},
    {
        headerMode: "float",
    }
)

const LoadingStack = createStackNavigator({
    LoadingScreen: {
        screen: Loading,
    }
},
    {
        headerMode: "float",
    }
)

const Container = createAppContainer(createSwitchNavigator({
    LoggedIn: {
        screen: LoggedIn,
    },
    Loading: {
        screen: LoadingStack,
    },
    NotLoggedIn: {
        screen: NotLoggedIn,
    }
},
    {
        initialRouteName: 'Loading',

    }
))

export default class AppContainer extends React.Component<Props> {
    constructor(props: Props) {
        super(props)
    }

    navigator: NavigationContainerComponent | null = null;

    componentWillReceiveProps(props: Props) {
        if (this.props.appStatus != props.appStatus) {
            this.navigator && this.navigator.dispatch(
                NavigationActions.navigate({
                    routeName: props.appStatus,
                })
            )
        }
    }

    render() {
        return <Container ref={nav => this.navigator = nav} />
    }
}