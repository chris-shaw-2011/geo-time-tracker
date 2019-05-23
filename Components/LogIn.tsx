import React from "react"
import { Container, Content, Form, Item, Input, Label, Button, Icon } from "native-base";
import GlobalSettings from "../Classes/GlobalSettings";
import { NavigationScreenProp, NavigationState, NavigationParams } from "react-navigation";
import { Text } from "react-native";
import styles from "../Classes/Styles";
import NavigationOptions from "../Classes/NavigationOptions";
import { Page } from "./Page";

interface Props {
}

interface State {
    username: string,
    password: string,
    usernameError: boolean,
    passwordError: boolean,
}

export default class LogIn extends Page<Props, State> {
    static navigationOptions = NavigationOptions("Log In")

    constructor(props: Props, context: React.ContextType<React.Context<GlobalSettings>>) {
        super(props)

        this.logIn = this.logIn.bind(this);
        this.usernameChanged = this.usernameChanged.bind(this);
        this.passwordChanged = this.passwordChanged.bind(this);
        this.state = {
            username: context.username,
            password: "",
            usernameError: false,
            passwordError: false,
        }
    }

    usernameChanged(username: string) {
        this.setState({
            username: username,
            usernameError: username ? false : true,
        })
    }

    passwordChanged(password: string) {
        this.setState({
            password: password,
            passwordError: password ? false : true,
        })
    }

    logIn() {
        if (!this.state.usernameError && !this.state.passwordError && this.state.username && this.state.password) {
            this.context.logInSuccessful(this.state.username, "abc123")
        }
        else {
            this.setState(state => {
                return {
                    passwordError: state.password ? false : true,
                    usernameError: state.username ? false : true,
                }
            })
        }
    }

    render() {
        return (
            <Container>
                <Content>
                    <Form style={styles.form}>
                        <Item floatingLabel error={this.state.usernameError}>
                            <Label>Username</Label>
                            <Input textContentType="username" value={this.state.username} onChangeText={this.usernameChanged} />
                            {this.state.usernameError && <Icon name="close-circle" />}
                        </Item>
                        <Item floatingLabel error={this.state.passwordError}>
                            <Label>Password</Label>
                            <Input textContentType="password" secureTextEntry={true} returnKeyType="go" value={this.state.password} onChangeText={this.passwordChanged} onSubmitEditing={this.logIn} />
                            {this.state.passwordError && <Icon name="close-circle" />}
                        </Item>
                        <Button full primary light onPress={this.logIn} style={styles.button}>
                            <Text style={styles.buttonText}>Log In</Text>
                        </Button>
                    </Form>
                </Content>
            </Container>
        )
    }
}