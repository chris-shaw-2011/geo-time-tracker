package com.geotimetracker.gps;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Date;

public class GpsTrackingModule extends ReactContextBaseJavaModule {
    private GpsTrackingService locationService = null;

    GpsTrackingModule(ReactApplicationContext reactContext) {
        super(reactContext); //required by React Native

        // Monitors the state of the connection to the service.
        ServiceConnection serviceConnection = new ServiceConnection() {
            @Override
            public void onServiceConnected(ComponentName name, IBinder service) {
                GpsTrackingService.LocalBinder binder = (GpsTrackingService.LocalBinder) service;
                locationService = binder.getService();
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {
                locationService = null;
            }
        };
        reactContext.bindService(new Intent(reactContext, GpsTrackingService.class), serviceConnection, Context.BIND_AUTO_CREATE);
    }

    @NonNull
    public String getName() {
        return "GpsTracking";
    }

    @ReactMethod
    public void startTracking(double beginDate, int updateInterval, Promise promise) {
        locationService.start(new Date(Double.valueOf(beginDate).longValue()), updateInterval);

        promise.resolve("success");
    }

    @ReactMethod
    public void stopTracking(Promise promise) {
        locationService.stop();

        promise.resolve("success");
    }
}
