import { LatLng } from "react-native-maps";
import { Guid } from "guid-typescript"
import { ResultSetRowList } from "react-native-sqlite-storage";
import PushNotification from "react-native-push-notification";
import moment from "moment";
import db from "./Database";
import Geolocation from "@react-native-community/geolocation";

interface TimecardCoordinate {
    coordinate: LatLng,
    accuracy: number,
    time: Date,
    id: Guid,
}

var _activeTimecard: ActiveTimecard | undefined;

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
            PushNotification.cancelAllLocalNotifications();
        }

        if (activeTimecard && (!_activeTimecard || _activeTimecard.id.toString() != activeTimecard.id.toString())) {
            const showId = activeTimecard.rowId!.toString()
            PushNotification.localNotification({
                ongoing: true,
                actions: "['Open', 'Clock Out']",
                title: "Clocked In",
                message: `Since ${moment(activeTimecard.timeIn).format('MMMM Do YYYY, h:mm a')}`,
                id: showId,
                autoCancel: false,
                priority: "low",
                urgency: "low",
            })
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
    public coordinates: TimecardCoordinate[] = []
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
    constructor(t:Timecard) {
        super(t.id, t.timeIn, t.timeOut, t.originalTimeIn, t.originalTimeOut, t.description, t.rowId)
    }

    public clockOut() {
        db.updateTimecard(new Timecard(this.id, this.timeIn, new Date(), this.originalTimeIn, this.originalTimeOut, this.description, this.rowId))
    }
}
