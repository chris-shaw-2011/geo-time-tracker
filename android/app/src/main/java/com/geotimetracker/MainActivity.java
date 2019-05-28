package com.geotimetracker;

import android.os.Bundle;
import android.os.PersistableBundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import javax.annotation.Nullable;

public class MainActivity extends ReactActivity {
    GeofenceHelper helper;

    public MainActivity() {
        helper = new GeofenceHelper(this);
    }
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "GeoTimeTracker";
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState, @Nullable PersistableBundle persistentState) {
        super.onCreate(savedInstanceState, persistentState);
    }

    @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
            return new ReactActivityDelegate(this, getMainComponentName()) {
      @Override
      protected ReactRootView createRootView() {
                       return new RNGestureHandlerEnabledRootView(MainActivity.this);
                      }
    };
          }
/*    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Override
            protected Bundle getLaunchOptions() {
                Bundle initialProperties = new Bundle();

                helper.add("Mike's", 39.2872402, -83.949203, 525.96f);
                helper.add("Whitacre's", 39.276888,-83.940524, 444.63f);
                helper.add("Shaw Farms", 39.171643,-84.185383, 595.53f);

                initialProperties.putParcelableArrayList("geofences", Props.getReactGeofences());
                return initialProperties;
            }
        };
    }*/
}
