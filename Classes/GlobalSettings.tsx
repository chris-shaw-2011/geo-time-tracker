import { SQLiteDatabase } from "react-native-sqlite-storage";
import Geofence from "./Geofence";
import Timecard from "./Timecard";

type LogInSuccessful = (username: string, token: string) => Promise<void>;
type LogOut = () => Promise<void>;
type UpdateGeofence = (newGeofence?: Geofence, originalName?: string) => Promise<void>;
type SetTitle = (title: string) => void
type UpdateTimecard = (newTimeCard:Timecard) => Promise<void>;

interface GlobalSettingsConstructor {
    username?: string;
    token?: string;
    logInSuccessful?: LogInSuccessful
    logOut?: LogOut
    geofences?: Geofence[],
    defaultGlobalSettings: GlobalSettings | undefined
    updateGeofence?: UpdateGeofence,
    setTitle?: SetTitle,
    title?: string,
}

export default class GlobalSettings {
    private _username: string;
    private _token: string;
    private _logInSuccessful?: LogInSuccessful
    private _logOut?: LogOut
    private readonly _geofences: Geofence[]
    private _updateGeofence?: UpdateGeofence
    private _setTitle?: SetTitle
    private _title?: string;

    public get token(): string {
        return this._token;
    }
    public get username(): string {
        return this._username;
    }
    public get geofences(): Geofence[] {
        return this._geofences
    }
    public get title(): string {
        return this._title || "No Title";
    }

    public logInSuccessful(username: string, token: string) {
        return this._logInSuccessful!(username, token)
    }

    public logOut() {
        return this._logOut!();
    }

    /**
     * 
     * @param newGeofence The new values of the geofence or undefined if you want to delete it
     * @param originalName The original name of the geofence you want to update (or delete), undefined if creating a new geofence
     */
    public updateGeofence(newGeofence?: Geofence, originalName?: string) {
        return this._updateGeofence!(newGeofence, originalName);
    }

    public setTitle(title: string) {
        return this._setTitle!(title);
    }

    constructor(settings?: GlobalSettingsConstructor) {
        this._username = GlobalSettings.constructorValue("username", settings, "")
        this._token = GlobalSettings.constructorValue("token", settings, "")
        this._logInSuccessful = GlobalSettings.constructorValue<LogInSuccessful | undefined>("logInSuccessful", settings, undefined)
        this._logOut = GlobalSettings.constructorValue<LogOut | undefined>("logOut", settings, undefined)
        this._updateGeofence = GlobalSettings.constructorValue<UpdateGeofence | undefined>("updateGeofence", settings, undefined)
        this._geofences = GlobalSettings.constructorValue("geofences", settings, new Array<Geofence>())
        this._setTitle = GlobalSettings.constructorValue<SetTitle | undefined>("setTitle", settings, undefined)
        this._title = GlobalSettings.constructorValue("title", settings, "")
    }

    private static constructorValue<T>(field: string, settings: any, defaultValue: T): T {
        return settings && (settings[field] || settings[field] === "") ? settings[field] : settings && settings.defaultGlobalSettings && settings.defaultGlobalSettings["_" + field] ? settings.defaultGlobalSettings["_" + field] : defaultValue;
    }
}