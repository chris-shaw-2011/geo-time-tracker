import { SQLiteDatabase } from "react-native-sqlite-storage";


type LogInSuccessful = (username: string, token: string) => Promise<void>;
type LogOut = () => Promise<void>;

interface GlobalSettingsConstructor {
    username?: string;
    token?: string;
    db?: SQLiteDatabase;
    logInSuccessful?: LogInSuccessful
    logOut?: LogOut
    defaultGlobalSettings: GlobalSettings | undefined
}

export default class GlobalSettings {
    private _username: string;
    private _token: string;
    private _db?: SQLiteDatabase;
    private _logInSuccessful?: LogInSuccessful
    private _logOut?: LogOut

    public get db(): SQLiteDatabase {
        return this._db!;
    }
    public get token(): string {
        return this._token;
    }
    public get username(): string {
        return this._username;
    }

    public logInSuccessful(username: string, token: string) {
        return this._logInSuccessful!(username, token)
    }

    public logOut() {
        return this._logOut!();
    }

    constructor(settings?: GlobalSettingsConstructor) {
        this._username = GlobalSettings.constructorValue("username", settings, "")
        this._token = GlobalSettings.constructorValue("token", settings, "")
        this._db = GlobalSettings.constructorValue<SQLiteDatabase | undefined>("db", settings, undefined)
        this._logInSuccessful = GlobalSettings.constructorValue<LogInSuccessful | undefined>("logInSuccessful", settings, undefined)
        this._logOut = GlobalSettings.constructorValue<LogOut | undefined>("logOut", settings, undefined)
    }

    private static constructorValue<T>(field: string, settings: any, defaultValue: T) : T {
        return settings && (settings[field] || settings[field] === "")? settings[field] : settings && settings.defaultGlobalSettings && settings.defaultGlobalSettings["_" + field] ? settings.defaultGlobalSettings["_" + field] : defaultValue;
    }
}