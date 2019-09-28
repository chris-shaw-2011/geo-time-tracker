package com.geotimetracker.gps;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Binder;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import android.provider.Settings;
import android.util.Log;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.geotimetracker.MainApplication;
import com.geotimetracker.R;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

import java.text.DateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Objects;

public class GpsTrackingService extends Service {
    private static final String TAG = GpsTrackingService.class.getSimpleName();

    private static final String SHARED_PREFERENCE_NAME = "GpsTrackingService";

    /**
     * The name of the channel for notifications.
     */
    private static final String CHANNEL_ID = "channel_01";

    private final IBinder mBinder = new LocalBinder();

    /**
     * The identifier for the notification displayed for the foreground service.
     */
    private static final int NOTIFICATION_ID = 1;

    private NotificationManager notificationManager;

    /**
     * Provides access to the Fused Location Provider API.
     */
    private FusedLocationProviderClient fusedLocationClient;

    /**
     * Callback for changes in location.
     */
    private LocationCallback locationCallback;

    private Handler serviceHandler;

    private Boolean gpsDisabled = false;
    private Boolean hasPermission = false;

    LocationManager locationManager;

    public GpsTrackingService() {
    }

    private Date beginDate;


    private BroadcastReceiver gpsSwitchStateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Objects.requireNonNull(intent.getAction()).matches(LocationManager.PROVIDERS_CHANGED_ACTION)) {
                if (isLocationEnabled() && gpsDisabled) {
                    onGpsEnabled();
                    gpsDisabled = false;
                }
                else if(!gpsDisabled) {
                    gpsDisabled = true;
                    onGpsDisabled();
                }
            }
        }
    };

    @Override
    public void onCreate() {
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        locationManager = (LocationManager) this.getSystemService(Context.LOCATION_SERVICE);

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                super.onLocationResult(locationResult);
                onNewLocation(locationResult.getLastLocation());
            }
        };

        HandlerThread handlerThread = new HandlerThread(TAG);
        handlerThread.start();
        serviceHandler = new Handler(handlerThread.getLooper());
        notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        // Android O requires a Notification Channel.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = getString(R.string.app_name);
            // Create the channel for the notification
            NotificationChannel mChannel = new NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_DEFAULT);

            // Set the Notification Channel for the Notification Manager.
            notificationManager.createNotificationChannel(mChannel);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Service started");

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        Log.i(TAG, "in onBind()");
        return mBinder;
    }

    @Override
    public void onRebind(Intent intent) {
        Log.i(TAG, "in onRebind()");
        super.onRebind(intent);
    }

    public void start(Date beginDate, int updateInterval) {
        this.beginDate = beginDate;
        requestLocationUpdates(updateInterval);
        startForeground(NOTIFICATION_ID, getNotification());
        registerReceiver(gpsSwitchStateReceiver, new IntentFilter(LocationManager.PROVIDERS_CHANGED_ACTION));
    }

    public void stop() {
        fusedLocationClient.removeLocationUpdates(locationCallback);
        stopForeground(true);
        unregisterReceiver(gpsSwitchStateReceiver);
    }

    @Override
    public void onDestroy() {
        serviceHandler.removeCallbacksAndMessages(null);
    }

    public void requestLocationUpdates(int updateInterval) {
        Log.i(TAG, "Requesting location updates");
        startService(new Intent(getApplicationContext(), GpsTrackingService.class));
        LocationRequest locationRequest = LocationRequest.create()
            .setInterval(updateInterval)
            .setFastestInterval(updateInterval)
            .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            hasPermission = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
        else {
            hasPermission = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }

        if(hasPermission) {
            getSharedPreferences(SHARED_PREFERENCE_NAME, MODE_PRIVATE).edit().putBoolean("hadLocationPermission", true).apply();

            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.myLooper());
        }
        else if (getSharedPreferences(SHARED_PREFERENCE_NAME, MODE_PRIVATE).getBoolean("hadLocationPermission", false)){
            MainApplication application = (MainApplication) this.getApplication();

            ReactNativeHost reactNativeHost = application.getReactNativeHost();
            ReactInstanceManager reactInstanceManager = reactNativeHost.getReactInstanceManager();
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();

            if (reactContext != null) {
                WritableNativeMap params = new WritableNativeMap();

                params.putDouble("time", System.currentTimeMillis());
                params.putString("message", "Location permission has been revoked");

                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("locationPermissionRevoked", params);

                getSharedPreferences(SHARED_PREFERENCE_NAME, MODE_PRIVATE).edit().putBoolean("hadLocationPermission", false).apply();
            }
        }
    }

    private Notification getNotification() {
        long diff = (System.currentTimeMillis() - beginDate.getTime()) / 1000;

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentText(String.format(Locale.getDefault(), "Since: %s (%d:%02d%s)", DateFormat.getDateTimeInstance().format(beginDate), diff / 3600, (diff % 3600) / 60, !hasPermission ? " - location denied" : gpsDisabled ? " - gps disabled" : ""))
                .setContentTitle("Clocked In")
                .setOngoing(true)
                .setPriority(Notification.PRIORITY_HIGH)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOnlyAlertOnce(true)
                .setWhen(System.currentTimeMillis()).build();
    }

    private void onNewLocation(Location location) {
        Log.i(TAG, "New location: " + location);

        sendLocationUpdate(location.getLatitude(), location.getLongitude(), (double) location.getAccuracy(), location.getTime());
    }

    private void sendLocationUpdate(Double latitude, Double longitude, Double accuracy, double time) {
        MainApplication application = (MainApplication) this.getApplication();

        ReactNativeHost reactNativeHost = application.getReactNativeHost();
        ReactInstanceManager reactInstanceManager = reactNativeHost.getReactInstanceManager();
        ReactContext reactContext = reactInstanceManager.getCurrentReactContext();

        if (reactContext != null) {
            WritableNativeMap params = new WritableNativeMap();
            if (latitude != null) {
                params.putDouble("latitude", latitude);
            }
            else {
                params.putNull("latitude");
            }
            if (longitude != null) {
                params.putDouble("longitude", longitude);
            }
            else {
                params.putNull("longitude");
            }
            if (accuracy != null) {
                params.putDouble("accuracy", accuracy);
            }
            else {
                params.putNull("accuracy");
            }
            params.putDouble("time", time);
            params.putString("message", "");

            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("locationUpdate", params);
        }

        notificationManager.notify(NOTIFICATION_ID, getNotification());
    }

    /**
     * Class used for the client Binder.  Since this service runs in the same process as its
     * clients, we don't need to deal with IPC.
     */
    class LocalBinder extends Binder {
        GpsTrackingService getService() {
            return GpsTrackingService.this;
        }
    }

    public Boolean isLocationEnabled() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) { // This is new method provided in API 28
            LocationManager lm = (LocationManager) this.getSystemService(Context.LOCATION_SERVICE);
            return lm.isLocationEnabled();
        } else { // This is Deprecated in API 28
            int mode = Settings.Secure.getInt(this.getContentResolver(), Settings.Secure.LOCATION_MODE, Settings.Secure.LOCATION_MODE_OFF);
            return (mode != Settings.Secure.LOCATION_MODE_OFF);
        }
    }

    private void onGpsEnabled() {
        gpsDisabled = false;
        MainApplication application = (MainApplication) this.getApplication();

        ReactNativeHost reactNativeHost = application.getReactNativeHost();
        ReactInstanceManager reactInstanceManager = reactNativeHost.getReactInstanceManager();
        ReactContext reactContext = reactInstanceManager.getCurrentReactContext();

        if (reactContext != null) {
            WritableNativeMap params = new WritableNativeMap();

            params.putDouble("time", System.currentTimeMillis());
            params.putString("message", "Location has been enabled");

            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("gpsEnabled", params);
        }

        notificationManager.notify(NOTIFICATION_ID, getNotification());
    }

    private void onGpsDisabled() {
        gpsDisabled = true;
        MainApplication application = (MainApplication) this.getApplication();

        ReactNativeHost reactNativeHost = application.getReactNativeHost();
        ReactInstanceManager reactInstanceManager = reactNativeHost.getReactInstanceManager();
        ReactContext reactContext = reactInstanceManager.getCurrentReactContext();

        if (reactContext != null) {
            WritableNativeMap params = new WritableNativeMap();

            params.putDouble("time", System.currentTimeMillis());
            params.putString("message", "Location has been disabled");

            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("gpsDisabled", params);
        }

        notificationManager.notify(NOTIFICATION_ID, getNotification());
    }
}