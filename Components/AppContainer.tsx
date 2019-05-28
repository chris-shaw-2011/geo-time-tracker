import React from 'react';
import { Header, Body, Title, Icon, Left, Right } from "native-base"
import { createDrawerNavigator, createStackNavigator, createAppContainer, DrawerActions, DrawerItems, createSwitchNavigator, NavigationContainerComponent, NavigationActions, HeaderProps } from "react-navigation";
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
import Geofence from "./Geofence"

interface Props {
    appStatus: AppStatus,
}

interface AppHeaderProps extends HeaderProps {
    allowDrawer?: boolean,
    title?: string
}

const AppHeader = (props: AppHeaderProps) => (
    <Header androidStatusBarColor={defaultColor} style={styles.header}>
        <Left>
            {props.allowDrawer && <Icon name="menu" onPress={() => props.navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.menu} />}
        </Left>
        <Body>
            <Title style={styles.title}>
                {props.title ?
                    props.title :
                    <GlobalSettingsContext.Consumer>
                        {value => value.title}
                    </GlobalSettingsContext.Consumer>
                }
            </Title>
        </Body>
        <Right />
    </Header>
)

const GeofencesStack = createStackNavigator({
    GeofencesList: { screen: Geofences },
    Geofence: { screen: Geofence }
}, {
        headerMode: "none",
        initialRouteName: "GeofencesList",
    })

const Drawer = createDrawerNavigator({
    Home: { screen: Home },
    Geofences: { screen: GeofencesStack },
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
        headerMode: "float",
        defaultNavigationOptions: {
            header: props => (<AppHeader allowDrawer={true} {...props} />)
        }
    }
)

const NotLoggedIn = createStackNavigator({
    LogInScreen: {
        screen: LogIn,
    }
},
    {
        defaultNavigationOptions: {
            header: props => (<AppHeader title="Log In" {...props} />),
        }
    }
)

const LoadingStack = createStackNavigator({
    LoadingScreen: {
        screen: Loading,
    }
},
    {
        defaultNavigationOptions: {
            header: props => (<AppHeader title="Geo Time Tracker" {...props} />),
        }

    }
)

const Container = createAppContainer(createSwitchNavigator({
    LoggedIn: {
        screen: DrawerStack,
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