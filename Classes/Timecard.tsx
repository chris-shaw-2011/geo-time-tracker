import { LatLng } from "react-native-maps";
import { Guid } from "guid-typescript"
import { ResultSetRowList } from "react-native-sqlite-storage";
import moment from "moment";
import db from "./Database";
import BackgroundGeolocation from "@mauron85/react-native-background-geolocation";
import GelocationHelpers from "./GeolocationHelpers"

export interface TimecardCoordinate {
    coordinate: LatLng,
    accuracy: number,
    time: Date,
    id: Guid,
}

var _activeTimecard: ActiveTimecard | undefined;

BackgroundGeolocation.configure({
    desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
    debug: false,
    startOnBoot: true,
    stopOnTerminate: false,
    locationProvider: BackgroundGeolocation.RAW_PROVIDER,
    interval: 5 * 60 * 1000,
    fastestInterval: 5 * 60 * 1000,
    stopOnStillActivity: false,
});

BackgroundGeolocation.on('location', (location) => {
    db.logMessage("Location Updated");
    if(_activeTimecard) {
        db.addTimecardCoordinate({
            id: Guid.create(),
            coordinate: {
                latitude: location.latitude,
                longitude: location.longitude,
            },
            accuracy: location.accuracy,
            time: new Date(location.time),
        }, _activeTimecard.id)
    }
});

BackgroundGeolocation.on('error', (error) => {
    db.logMessage(`[ERROR] BackgroundGeolocation error: ${error.message}`)
});

BackgroundGeolocation.on('start', () => {
    db.logMessage('[INFO] BackgroundGeolocation service has been started');
});

BackgroundGeolocation.on('stop', () => {
    db.logMessage('[INFO] BackgroundGeolocation service has been stopped');
});

BackgroundGeolocation.on('authorization', (status) => {
    db.logMessage(`[INFO] BackgroundGeolocation authorization status: ${status}`);
});

BackgroundGeolocation.on('background', () => {
    db.logMessage('[INFO] App is in background');
  });

  BackgroundGeolocation.on('foreground', () => {
    db.logMessage('[INFO] App is in foreground');
  });

  BackgroundGeolocation.headlessTask((event) => {
      db.logMessage(`[INFO] Headless task ${event.name}: ${event.params}`)

    return 'Processing event: ' + event.name; // will be logged
});

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
            BackgroundGeolocation.stop();
        }

        if (activeTimecard && (!_activeTimecard || _activeTimecard.id.toString() != activeTimecard.id.toString())) {
            const showId = activeTimecard.rowId!.toString()
            BackgroundGeolocation.configure({
                notificationTitle: "Clocked In",
                notificationText: `Since ${moment(activeTimecard.timeIn).format('MMMM Do YYYY, h:mm a')}`,
            })
            BackgroundGeolocation.start();
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
        }, this.id)
    }
}
