import React from "react"
import { Container, Button, H3, Text } from "native-base";
import { View } from "react-native";


export default class Home extends React.Component {
    static navigationOptions = {
        title: "Home",
    }

    render() {
        return (
            <View  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text onPress={() => {console.log(this.props.navigation);this.props.navigation.openDrawer()}}>Home2</Text>
            </View>
        )
    }
}