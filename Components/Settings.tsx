import React from "react"
import { NavigationScreenOptions, NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";
import { View, Text } from "react-native";
import VersionNumber from 'react-native-version-number';
import GlobalSettingsContext from "../Classes/GlobalSettingsContext";
import GlobalSettings from "../Classes/GlobalSettings";
import { Button } from "native-base";
import styles from "../Classes/Styles";

interface Props {
    navigation: NavigationScreenProp<NavigationState, NavigationParams>,
}

export default class Settings extends React.Component<Props> {
    static navigationOptions : NavigationScreenOptions = {
        title: "Settings",
        headerStyle: {
            backgroundColor: "red",
        },
        headerTintColor: "white",
        drawerLabel: () => null,
    }
    static contextType = GlobalSettingsContext
    context!: React.ContextType<React.Context<GlobalSettings>>;

    constructor(props: Props) {
        super(props);
        this.logOut = this.logOut.bind(this);
        this.navigateAfterLogOut = this.navigateAfterLogOut.bind(this);
    }

    logOut() {
        this.context.logOut().then(this.navigateAfterLogOut)
    }

    navigateAfterLogOut() {
        this.props.navigation.navigate("NotLoggedIn")
    }

    render() {
        return (
            <View>
                <View>
                    <Text>Logged In As: {this.context.username}</Text>
                    <Button full primary light onPress={this.logOut} style={styles.button}>
                        <Text style={styles.buttonText}>Log Out</Text>
                    </Button>
                </View>
                <View>
                    <Text>Version: {VersionNumber.appVersion}</Text>
                </View>
            </View>
        )
    }
}