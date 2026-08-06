package  com.thatsend.mahjfit;

import android.graphics.Color;
import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private void applyEdgeToEdge() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyEdgeToEdge();
    }

    @Override
    public void onStart() {
        super.onStart();
        applyEdgeToEdge();
    }
    @Override
    public void onResume() {
        super.onResume();
        applyEdgeToEdge();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyEdgeToEdge();
        }
    }
}