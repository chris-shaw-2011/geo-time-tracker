import { StyleSheet } from "react-native";

export const defaultColor = "red";
export const textColor = "white"

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
        backgroundColor: defaultColor,
    },
    menu: {
        color: textColor,
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