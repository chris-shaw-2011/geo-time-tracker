import React from "react"
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    button: {
        width: "75%",
        marginTop: 5,
        alignSelf: "center",
    },
    buttonText: {
        fontWeight: "bold",
    },
    title: {
        fontWeight: "bold",
    },
    header: {
        backgroundColor: "red",
    },
    menu: {
        color: "white",
    },
    loadingView: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    error: {
        borderColor: "red",
        borderWidth: 1,
    },
    form: {
        width: "95%",
        alignSelf: "center",
    }
})

export default styles;