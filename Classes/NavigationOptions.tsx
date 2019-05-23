import { NavigationScreenOptions } from "react-navigation";
import styles, { textColor } from "./Styles"

export default (title: string, options?: NavigationScreenOptions): NavigationScreenOptions => {
    var ret = options || {} as NavigationScreenOptions;

    ret.title = title;
    ret.headerStyle = styles.header;
    ret.headerTintColor = textColor;

    return ret;
}