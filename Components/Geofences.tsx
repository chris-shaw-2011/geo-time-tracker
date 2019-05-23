import React from "react"
import { View } from "native-base";
import { Text } from "react-native";
import NavigationOptions from "../Classes/NavigationOptions";

export default class Geofences extends React.Component {
    static navigationOptions = NavigationOptions("Geofences")

    render() {
        return (
            <View>
                <Text>Geofences</Text>
            </View>
        )
    }
}