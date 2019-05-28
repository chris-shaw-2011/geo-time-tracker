import React from "react"
import { NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";
import { View, Text } from "react-native";
import VersionNumber from 'react-native-version-number';
import { Button } from "native-base";
import styles from "../Classes/Styles";
import { Page } from "./Page";

interface Props {
    navigation: NavigationScreenProp<NavigationState, NavigationParams>,
}

export default class Settings extends Page<Props> {
    title = "Settings"

    constructor(props: Props) {
        super(props);
        this.logOut = this.logOut.bind(this);
    }

    logOut() {
        this.context.logOut()
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