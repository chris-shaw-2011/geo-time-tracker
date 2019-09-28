import SQLite from 'react-native-sqlite-storage'
import GlobalEvents, { Event } from "./GlobalEvents";
import Timecard, { ActiveTimecard, TimecardEvent } from './Timecard';
import { Guid } from 'guid-typescript';

SQLite.enablePromise(true);

class Database implements SQLite.SQLiteDatabase {
    private _database?: SQLite.SQLiteDatabase;

    private async setup() {
        if (!this._database) {
            const db = await SQLite.openDatabase({
                name: "database",
                location: "default",
            })

            await db.executeSql("CREATE TABLE IF NOT EXISTS geofence (name TEXT PRIMARY KEY, latitude FLOAT, longitude FLOAT, radius FLOAT)")
            await db.executeSql("CREATE TABLE IF NOT EXISTS timecard (id TEXT PRIMARY KEY, timeIn BIGINT, originalTimeIn BIGINT, timeOut BIGINT, originalTimeOut BIGINT, description TEXT)");
            await db.executeSql("CREATE TABLE IF NOT EXISTS timecardEvent (id TEXT PRIMARY KEY, timecardId TEXT, latitude FLOAT, longitude FLOAT, accuracy FLOAT, time BIGINT, message TEXT, FOREIGN KEY(timecardId) REFERENCES timecard(id))")
            await db.executeSql("CREATE TABLE IF NOT EXISTS log (message TEXT, data TEXT, time BIGINT)")

            const version = (await db.executeSql("PRAGMA user_version"))[0].rows.item(0).user_version as Number;

            if (version === 0) {
                await db.executeSql("PRAGMA user_version = 1")
            }

            this._database = db;
        }
    }

    transaction(scope: (tx: SQLite.Transaction) => void): Promise<SQLite.Transaction>
    transaction(scope: (tx: SQLite.Transaction) => void, error?: SQLite.TransactionErrorCallback | undefined, success?: SQLite.TransactionCallback | undefined): void;
    transaction(scope: any, error?: any, success?: any) {
        if (!this._database) {
            return this.setup().then(() => this.transaction(scope, error, success))
        }
        else if (!error && !success) {
            return this._database.transaction(scope);
        }
        else {
            return this._database.transaction(scope, error, success);
        }
    }

    readTransaction(scope: (tx: SQLite.Transaction) => void): Promise<SQLite.TransactionCallback>;
    readTransaction(scope: (tx: SQLite.Transaction) => void, error?: SQLite.TransactionErrorCallback | undefined, success?: SQLite.TransactionCallback | undefined): void;
    readTransaction(scope: any, error?: any, success?: any) {
        if (!this._database) {
            return this.setup().then(() => this.readTransaction(scope, error, success))
        }
        else if (!error && !success) {
            return this._database.readTransaction(scope);
        }
        else {
            return this._database.readTransaction(scope, error, success);
        }
    }

    close(): Promise<void>;
    close(success: () => void, error: (err: SQLite.SQLError) => void): void;
    close(success?: any, error?: any) {
        if (!this._database) {
            return this.setup().then(() => this.close(success, error))
        }
        else {
            return this._database.close(success, error);
        }
    }
    executeSql(statement: string, params?: any[] | undefined): Promise<[SQLite.ResultSet]>;
    executeSql(statement: string, params?: any[] | undefined, success?: SQLite.StatementCallback | undefined, error?: SQLite.StatementErrorCallback | undefined): void;
    executeSql(statement: any, params?: any, success?: any, error?: any) {
        if (!this._database) {
            return this.setup().then(() => this.executeSql(statement, params, success, error))
        }
        else if (!error && !success) {
            return this._database.executeSql(statement, params)
        }
        else {
            return this._database.executeSql(statement, params, success, error)
        }
    }
    attach(nameToAttach: string, alias: string): Promise<void>;
    attach(nameToAttach: string, alias: string, success?: (() => void) | undefined, error?: ((err: SQLite.SQLError) => void) | undefined): void;
    attach(nameToAttach: any, alias: any, success?: any, error?: any) {
        if (!this._database) {
            return this.setup().then(() => this.attach(nameToAttach, alias, success, error))
        }
        else {
            return this._database.attach(nameToAttach, alias, success, error)
        }
    }
    dettach(alias: string): Promise<void>;
    dettach(alias: string, success?: (() => void) | undefined, error?: ((err: SQLite.SQLError) => void) | undefined): void;
    dettach(alias: any, success?: any, error?: any) {
        if (!this._database) {
            return this.setup().then(() => this.dettach(alias, success, error))
        }
        else {
            return this._database.dettach(alias, success, error);
        }
    }

    public async updateTimecard(timecard: Timecard) {
        const { id, timeInTimestamp, timeOutTimestamp, originalTimeInTimestamp, originalTimeOutTimestamp, description } = timecard;

        await db.executeSql("INSERT OR REPLACE INTO timecard (id, timeIn, originalTimeIn, timeOut, originalTimeOut, description) VALUES (?, ?, ?, ?, ?, ?)", [id.toString(), timeInTimestamp, originalTimeInTimestamp, timeOutTimestamp, originalTimeOutTimestamp, description])

        if (!timeOutTimestamp) {
            const activeTimecard = Timecard.fromDatabase((await db.executeSql("SELECT *, rowid from timecard where id = ?", [id.toString()]))[0].rows).pop();
            Timecard.activeTimecard = activeTimecard ? new ActiveTimecard(activeTimecard) : undefined;
        }
        else if (timeOutTimestamp && Timecard.activeTimecard && Timecard.activeTimecard.id.toString() == id.toString()) {
            Timecard.activeTimecard = undefined;
        }

        GlobalEvents.emit(Event.TimecardUpdate)
    }

    public async addTimecardEvent(id: Guid, time: Date, message: string, timecardId: Guid, latitude?: number, longitude?: number, accuracy?: number, ) {
        await db.executeSql("INSERT INTO timecardEvent (id, timecardId, latitude, longitude, accuracy, time, message) VALUES(?, ?, ?, ?, ?, ?, ?)", [id.toString(), timecardId.toString(), latitude ? latitude : null, longitude ? longitude : null, accuracy ? accuracy : null, time.getTime() / 1000, message])

        GlobalEvents.emit(Event.TimecardCoordinateAdded);
    }

    public async logMessage(message: String, data?: object) {
        await db.executeSql("INSERT INTO log (message, data, time) VALUES (?, ?, ?)", [message, data ? JSON.stringify(data, undefined, 3) : null, new Date().getTime() / 1000])

        GlobalEvents.emit(Event.LogAdded)
    }
}

const db = new Database();

export default db;