import React from "react"
import { Button, ListItem, Container, Content, Left, Right, Icon } from "native-base";
import { Text, FlatList } from "react-native";
import NavigationOptions from "../Classes/NavigationOptions";
import styles from "../Classes/Styles";
import { Page } from "./Page";
import { NavigationState, NavigationScreenProp, NavigationParams } from "react-navigation";
import Geofence from "../Classes/Geofence";
import GlobalSettingsContext from "../Classes/GlobalSettingsContext";

interface Props {
    navigation: NavigationScreenProp<NavigationState, NavigationParams>
}

interface State {
    geofences: Geofence[],
}

export default class Geofences extends Page<Props, State> {
    title = "Geofences"

    constructor(props: Props) {
        super(props)

        this.addGeofence = this.addGeofence.bind(this);
        this.geofenceSelected = this.geofenceSelected.bind(this);
    }

    state: State = {
        geofences: [],
    }

    addGeofence() {
        this.props.navigation.navigate("Geofence");
    }

    geofenceSelected(geofence: Geofence) {
        this.props.navigation.navigate("Geofence", { geofence: geofence })
    }

    render() {
        return (
            <Container>
                <Content>
                    <Button full primary light style={styles.button} onPress={this.addGeofence}>
                        <Text style={styles.buttonText}>Add Geofence</Text>
                    </Button>
                    <GlobalSettingsContext.Consumer>
                        {value =>
                            <FlatList data={value.geofences} keyExtractor={item => item.name} renderItem={({ item }) => (
                                <ListItem onPress={() => this.geofenceSelected(item)}>
                                    <Left>
                                        <Text>{item.name}</Text>
                                    </Left>
                                    <Right>
                                        <Icon name="arrow-forward" />
                                    </Right>
                                </ListItem>
                            )} />
                        }
                    </GlobalSettingsContext.Consumer>
                </Content>
            </Container>
        )
    }
}