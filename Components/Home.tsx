import React from "react"
import { Container, Button, H3, Text } from "native-base";
import { View } from "react-native";
import NavigationOptions from "../Classes/NavigationOptions";

export default class Home extends React.Component {
    static navigationOptions = NavigationOptions("Home")

    render() {
        return (
            <View  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Home2</Text>
            </View>
        )
    }
}