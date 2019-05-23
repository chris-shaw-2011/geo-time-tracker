import React, {Component} from "react"
import GlobalSettingsContext from "../Classes/GlobalSettingsContext";
import GlobalSettings from "../Classes/GlobalSettings";


export interface Page<P = {}, S = {}, SS = any>{ }

export class Page<P, S> extends Component<P, S> {
    static contextType = GlobalSettingsContext
    context!: React.ContextType<React.Context<GlobalSettings>>;
}