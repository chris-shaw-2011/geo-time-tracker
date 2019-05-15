import React, { Component } from "react";
import { Container, Content, List, ListItem, Left } from "native-base";
import { Text } from "react-native";
import { DrawerItemsProps } from "react-navigation";

export default class SideBar extends Component<DrawerItemsProps> {
    render() {

        const items = this.props.items;
        return (
            <Container>
                <Content>
                    <List>
                        <ListItem button noBorder onPress={() => this.props.navigation.navigate("Home1")}>
                            <Left>
                                <Text>Home</Text>
                            </Left>
                        </ListItem>
                        <ListItem button noBorder onPress={() => this.props.navigation.navigate("Geofences")}>
                            <Left>
                                <Text>Geofences</Text>
                            </Left>
                        </ListItem>
                    </List>
                </Content>
            </Container>
        )
    }
}