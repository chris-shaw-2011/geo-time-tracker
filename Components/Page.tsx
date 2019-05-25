import React, {Component} from "react"
import GlobalSettingsContext from "../Classes/GlobalSettingsContext";
import GlobalSettings from "../Classes/GlobalSettings";
import { NavigationScreenProp, NavigationState, NavigationParams, NavigationEventSubscription } from "react-navigation";

export interface Page<P = {navigation: NavigationScreenProp<NavigationState, NavigationParams>}, S = {}, SS = any>{ }

export abstract class Page<P, S> extends Component<P, S> {
    static contextType = GlobalSettingsContext
    context!: React.ContextType<React.Context<GlobalSettings>>;

    abstract title:string;
    private willFocusListener:NavigationEventSubscription
    
    constructor(props:P) {
        super(props);

        this.willFocusListener = ((props as any) as {navigation: NavigationScreenProp<NavigationState, NavigationParams>}).navigation.addListener("willFocus", () => this.context.setTitle(this.title))
    }

    componentWillUnmount() {
        this.willFocusListener.remove();
    }
}