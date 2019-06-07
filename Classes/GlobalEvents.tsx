import { Listener } from "events"
import { DeviceEventEmitter } from "react-native";

export enum Event {
    TimecardUpdate = "TimecardUpdate",
    TimecardCoordinateAdded = "TimecardCoordinateAdded",
    LogAdded = "LogAdded",
}

export class GlobalEventListener {
    private _event:Event;
    private _listener:Listener

    constructor(event:Event, listener:Listener) {
        this._event = event;
        this._listener = listener
    }

    remove() {
        DeviceEventEmitter.removeListener(this._event, this._listener)
    }
}

class GlobalEvents {
    static addListener(event:Event, listener:Listener) {
        const call = (...args: any[]) => listener(...args)

        DeviceEventEmitter.addListener(event, call)

        return new GlobalEventListener(event, call);
    }

    static emit(event:Event, ...args: any[]) {
        return DeviceEventEmitter.emit(event, args)
    }
}

export default GlobalEvents;