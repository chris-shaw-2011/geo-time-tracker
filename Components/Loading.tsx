import React from "react"
import { View, ActivityIndicator } from "react-native";
import { Text } from "native-base";
import styles, { defaultColor } from "../Classes/Styles";
import NavigationOptions from "../Classes/NavigationOptions";

export default class Loading extends React.Component {
    static navigationOptions = NavigationOptions("Geo Time Tracker")

    render() {
        return (
            <View style={styles.loadingView}>
                <ActivityIndicator color={defaultColor} /><Text>Loading</Text>
            </View>
        )
    }
}