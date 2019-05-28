package com.geotimetracker

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.support.v4.content.ContextCompat.checkSelfPermission
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices

class GeofenceHelper(private var context: Context) {
    private val geofencingClient: GeofencingClient by lazy {
        LocationServices.getGeofencingClient(context)
    }
    private val geofencePendingIntent: PendingIntent by lazy {
        val intent = Intent(context, GeofenceTransitionsIntentService::class.java)
        PendingIntent.getService(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT)
    }

    public fun add(name: String, latitude: Double, longitude: Double, radius: Float ) {
        val geofence = Geofence.Builder()
                .setRequestId(name)
                .setCircularRegion(latitude, longitude, radius)
                .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER or Geofence.GEOFENCE_TRANSITION_EXIT or Geofence.GEOFENCE_TRANSITION_DWELL)
                .setLoiteringDelay(5 * 60 * 1000)
                .setNotificationResponsiveness(5 * 60 * 1000)
                .setExpirationDuration(Geofence.NEVER_EXPIRE)
                .build()

        if(checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            geofencingClient
                .addGeofences(
                    GeofencingRequest.Builder().apply {
                        setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
                        addGeofence(geofence)
                    }.build(), geofencePendingIntent)

            Props.addOrUpdateGeofence(geofence)
        }
    }
}