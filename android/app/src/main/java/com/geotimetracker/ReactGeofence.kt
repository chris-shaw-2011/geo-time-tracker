package com.geotimetracker

import android.os.Parcel
import android.os.Parcelable
import com.facebook.react.bridge.WritableNativeMap
import com.google.android.gms.location.Geofence
import java.io.Serializable

class ReactGeofence() : Parcelable {

    constructor(geofence: Geofence) : this() {
        this.name = geofence.requestId
    }

    private var _name: String = ""

    public var name:  String
        get() = this._name
        set(value)
        {
            _name = value
        }

    constructor(parcel: Parcel) : this() {
        name = parcel.readString() ?: ""
    }

    override fun writeToParcel(parcel: Parcel, flags: Int) {
        parcel.writeString(name)
    }

    override fun describeContents(): Int {
        return 0
    }

    companion object CREATOR : Parcelable.Creator<ReactGeofence> {
        override fun createFromParcel(parcel: Parcel): ReactGeofence {
            return ReactGeofence(parcel)
        }

        override fun newArray(size: Int): Array<ReactGeofence?> {
            return arrayOfNulls(size)
        }
    }
}