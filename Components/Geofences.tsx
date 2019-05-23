import React from "react"
import { View } from "native-base";
import { Text } from "react-native";

export default class Geofences extends React.Component {
    static navigationOptions = {
        title: "Geofences",
    }

    render() {
        return (
            <View>
                <Text>Geofences</Text>
            </View>
        )
    }
}