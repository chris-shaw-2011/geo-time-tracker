import React from "react"
import GlobalSettings from "./GlobalSettings";

const GlobalSettingsContext = React.createContext<GlobalSettings>(new GlobalSettings());

export default GlobalSettingsContext;