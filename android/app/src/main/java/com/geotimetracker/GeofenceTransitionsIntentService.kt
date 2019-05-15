package com.geotimetracker

import android.app.IntentService
import android.content.Intent
import android.util.Log
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingEvent

class GeofenceTransitionsIntentService : IntentService("GeoTrIntentService") {

    override fun onHandleIntent(intent: Intent?) {
        // 1
        val geofencingEvent = GeofencingEvent.fromIntent(intent)

        if(geofencingEvent.hasError()) {
            //Do something
        }
    }
}