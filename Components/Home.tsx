import React from "react"
import { Container, Button, H3, Text } from "native-base";
import { View } from "react-native";
import NavigationOptions from "../Classes/NavigationOptions";
import { Page } from "./Page";

export default class Home extends Page {
    title: string = "Home"

    render() {
        return (
            <View  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Home2</Text>
            </View>
        )
    }
}