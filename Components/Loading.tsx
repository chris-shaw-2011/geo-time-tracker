import React from "react"
import { View, ActivityIndicator } from "react-native";
import { Text } from "native-base";
import styles, { defaultColor } from "../Classes/Styles";

const Loading = () => (
    <View style={styles.loadingView}>
        <ActivityIndicator color={defaultColor} /><Text>Loading</Text>
    </View>
)

export default Loading;