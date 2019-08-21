import { LatLng } from "react-native-maps";
import { Guid } from "guid-typescript"
import { ResultSetRowList } from "react-native-sqlite-storage";
import db from "./Database";
import GelocationHelpers from "./GeolocationHelpers"
import { DeviceEventEmitter, NativeModules } from 'react-native';

const GpsTracking: GpsTracking = NativeModules.GpsTracking;

export interface TimecardEvent {
    coordinate?: LatLng,
    accuracy?: number,
    time: Date,
    id: Guid,
    message: string,
}

interface NewEvent {
    latitude?: number,
    longitude?: number,
    accuracy?: number,
    time: number,
    message: string,
}

interface GpsTracking {
    startTracking: (beginDate: number) => Promise<void>
    stopTracking: () => Promise<void>
}

var _activeTimecard: ActiveTimecard | undefined;
const locationUpdate = (data: NewEvent) => {
    db.logMessage("NewEvent", data);

    if (_activeTimecard) {
        db.addTimecardCoordinate({
            id: Guid.create(),
            coordinate: data.latitude && data.longitude ? {
                latitude: data.latitude,
                longitude: data.longitude,
            } : undefined,
            accuracy: data.accuracy,
            time: new Date(data.time),
            message: data.message,
        }, _activeTimecard.id)
    }
}

DeviceEventEmitter.addListener('locationUpdate', locationUpdate);

export default class Timecard {
    static fromDatabase(rows: ResultSetRowList) {
        var timecards: Timecard[] = [];

        for (var i = 0; i < rows.length; ++i) {
            const item = rows.item(i);
            timecards.push(new Timecard(item.id, new Date(item.timeIn * 1000), item.timeOut ? new Date(item.timeOut * 1000) : undefined, item.originalTimeIn ? new Date(item.originalTimeIn * 1000) : undefined, item.originalTimeOut ? new Date(item.originalTimeOut * 1000) : undefined, item.description, item.rowid));
        }
        return timecards;
    }

    static get activeTimecard() {
        return _activeTimecard
    }

    static set activeTimecard(activeTimecard: ActiveTimecard | undefined) {
        if (_activeTimecard && (!activeTimecard || _activeTimecard.id.toString() != activeTimecard.id.toString())) {
            GpsTracking.stopTracking();
        }

        if (activeTimecard && (!_activeTimecard || _activeTimecard.id.toString() != activeTimecard.id.toString())) {
            const showId = activeTimecard.rowId!.toString()
            GpsTracking.startTracking(activeTimecard.timeIn.getTime());
        }

        _activeTimecard = activeTimecard
    }

    constructor(id: Guid, timeIn: Date, timeOut?: Date, originalTimeIn?: Date, originalTimeOut?: Date, description?: string, rowId?: number) {
        this.timeIn = timeIn;
        this.id = id;
        this.originalTimeIn = originalTimeIn;
        this.timeOut = timeOut
        this.originalTimeOut = originalTimeOut
        this.description = description || ""
        this.rowId = rowId
    }

    public timeIn: Date
    public originalTimeIn?: Date
    public timeOut?: Date
    public originalTimeOut?: Date
    public description: string
    public id: Guid
    public rowId?: number

    public get timeInTimestamp() {
        return this.convertDateToTimestamp(this.timeIn)
    }

    public get originalTimeInTimestamp() {
        return this.dateToTimestamp(this.originalTimeIn);
    }

    public get timeOutTimestamp() {
        return this.dateToTimestamp(this.timeOut)
    }

    public get originalTimeOutTimestamp() {
        return this.dateToTimestamp(this.originalTimeOut)
    }

    private dateToTimestamp(date?: Date) {
        if (date) {
            return this.convertDateToTimestamp(date);
        }
        else {
            return undefined
        }
    }

    private convertDateToTimestamp(date: Date) {
        return Math.trunc(date.getTime() / 1000)
    }
}

export class ActiveTimecard extends Timecard {
    constructor(t: Timecard) {
        super(t.id, t.timeIn, t.timeOut, t.originalTimeIn, t.originalTimeOut, t.description, t.rowId)
    }

    public async clockOut() {
        const pos = await GelocationHelpers.getCurrentPosition();
        const dt = new Date(pos.timestamp);

        await db.updateTimecard(new Timecard(this.id, this.timeIn, dt, this.originalTimeIn, this.originalTimeOut, this.description, this.rowId))
        await db.addTimecardCoordinate({
            id: Guid.create(),
            coordinate: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            },
            accuracy: pos.coords.accuracy,
            time: dt,
            message: "",
        }, this.id)
    }
}
