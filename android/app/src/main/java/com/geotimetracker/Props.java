package com.geotimetracker;

import android.os.Parcelable;

import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.location.Geofence;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Props {
    private static HashMap<String, Geofence> Geofences = new HashMap<>();

    public static void addOrUpdateGeofence(Geofence geofence)
    {
        Geofences.put(geofence.getRequestId(), geofence);
    }

    public static void deleteGeofence(String name)
    {
        Geofences.remove(name);
    }

    public static ArrayList<ReactGeofence> getReactGeofences()
    {
        ArrayList<ReactGeofence> ret = new ArrayList<>();

        for (Geofence g : Geofences.values()) {
            ret.add(new ReactGeofence(g));
        }

        return ret;
    }
}
