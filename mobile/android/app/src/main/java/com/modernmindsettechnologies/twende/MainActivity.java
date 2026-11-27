package com.modernmindsettechnologies.twende;

import android.Manifest;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.journeyapps.barcodescanner.ScanContract;
import com.journeyapps.barcodescanner.ScanOptions;
import java.util.Arrays;
import java.util.Collections;

public final class MainActivity extends ComponentActivity {
    private WebView web;
    private ProgressBar progress;
    private ValueCallback<Uri[]> fileCallback;
    private GeolocationPermissions.Callback locationCallback;
    private String locationOrigin;
    private PermissionRequest cameraRequest;
    private AlertDialog loadError;

    private final ActivityResultLauncher<ScanOptions> scanner =
        registerForActivityResult(new ScanContract(), result -> {
            if (result.getContents() == null || !isFarePage()) return;
            String farePath = TwendeRoutes.scannedFarePath(result.getContents());
            if (farePath != null) {
                load(farePath);
            } else {
                new AlertDialog.Builder(this)
                    .setMessage("That QR code is not a Twende bus sign. Scan again or enter the bus number.")
                    .setPositiveButton("Scan again", (dialog, which) -> openScanner())
                    .setNegativeButton("Enter bus number", null).show();
            }
        });
    private final ActivityResultLauncher<Intent> files =
        registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
            var callback = fileCallback;
            fileCallback = null;
            if (callback == null) return;
            Uri[] selection = WebChromeClient.FileChooserParams.parseResult(result.getResultCode(), result.getData());
            if (selection != null && Arrays.stream(selection).anyMatch(uri -> !"content".equals(uri.getScheme()))) {
                selection = null;
            }
            callback.onReceiveValue(selection);
        });
    private final ActivityResultLauncher<String[]> location =
        registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), result -> {
            if (locationCallback != null) locationCallback.invoke(locationOrigin, hasLocation(), false);
            locationCallback = null;
            locationOrigin = null;
        });
    private final ActivityResultLauncher<String> camera =
        registerForActivityResult(new ActivityResultContracts.RequestPermission(), allowed -> {
            if (cameraRequest == null) return;
            if (allowed && isFarePage()) cameraRequest.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
            else cameraRequest.deny();
            cameraRequest = null;
        });

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        var root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(244, 246, 251));
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, insets) -> {
            Insets safe = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setVisibility(View.GONE);
        progress.setContentDescription("Loading Twende");
        root.addView(progress, new FrameLayout.LayoutParams(-1,
            Math.round(3 * getResources().getDisplayMetrics().density), Gravity.TOP));
        setContentView(root);
        WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightNavigationBars(true);
        configureWebView();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (web.canGoBack()) web.goBack();
                else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
        if (state == null || web.restoreState(state) == null) load(TwendeRoutes.START);
    }

    private void configureWebView() {
        var settings = web.getSettings();
        // Twende's own interactive pages need JavaScript. No native object is exposed to other origins.
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "twendeRiderScanner", Collections.singleton(TwendeRoutes.ORIGIN),
                (view, message, origin, mainFrame, reply) -> {
                    if (TwendeRoutes.canOpenScanner(view.getUrl(), origin.toString(), mainFrame, message.getData())) {
                        openScanner();
                    }
                });
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (!request.isForMainFrame()) return !TwendeRoutes.sameOrigin(url);
                if (TwendeRoutes.allowed(url)) return false;
                if (request.hasGesture() && "https".equalsIgnoreCase(request.getUrl().getScheme())) {
                    openExternal(request.getUrl());
                }
                return true;
            }

            @Override
            public void doUpdateVisitedHistory(WebView view, String url, boolean reload) {
                if (TwendeRoutes.sameOrigin(url) && !TwendeRoutes.allowed(url)) {
                    // Next.js can change history without a new document navigation.
                    if (view.canGoBack()) view.goBack();
                    else load(TwendeRoutes.START);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showLoadError(request.getUrl().toString());
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 500) {
                    showLoadError(request.getUrl().toString());
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int value) {
                progress.setProgress(value);
                progress.setVisibility(value > 0 && value < 100 ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (!TwendeRoutes.sameOrigin(origin) || locationCallback != null) {
                    callback.invoke(origin, false, false);
                } else if (hasLocation()) {
                    callback.invoke(origin, true, false);
                } else {
                    locationOrigin = origin;
                    locationCallback = callback;
                    location.launch(new String[] { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION });
                }
            }

            @Override
            public void onGeolocationPermissionsHidePrompt() {
                locationCallback = null;
                locationOrigin = null;
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                String video = PermissionRequest.RESOURCE_VIDEO_CAPTURE;
                if (!isFarePage() || !TwendeRoutes.sameOrigin(request.getOrigin().toString())
                        || !Arrays.asList(request.getResources()).contains(video) || cameraRequest != null) {
                    request.deny();
                } else if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                    request.grant(new String[] { video });
                } else {
                    cameraRequest = request;
                    camera.launch(Manifest.permission.CAMERA);
                }
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (request == cameraRequest) cameraRequest = null;
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (!TwendeRoutes.allowed(view.getUrl())) return false;
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    files.launch(params.createIntent());
                } catch (ActivityNotFoundException error) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                }
                return true;
            }
        });
    }

    private void openScanner() {
        if (!isFarePage()) return;
        scanner.launch(new ScanOptions().setDesiredBarcodeFormats(ScanOptions.QR_CODE)
            .setPrompt("Point your camera at the Twende bus sign")
            .setBeepEnabled(false).setOrientationLocked(false).setBarcodeImageEnabled(false));
    }

    private boolean isFarePage() {
        return web != null && TwendeRoutes.canOpenScanner(web.getUrl(), TwendeRoutes.ORIGIN, true, "scan");
    }

    private boolean hasLocation() {
        return checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void showLoadError(String url) {
        if (loadError != null && loadError.isShowing()) return;
        progress.setVisibility(View.GONE);
        final String retry = TwendeRoutes.allowed(url) ? url : TwendeRoutes.ORIGIN + TwendeRoutes.START;
        loadError = new AlertDialog.Builder(this)
            .setMessage("Twende could not connect. Check your data or Wi-Fi and try again.")
            .setPositiveButton("Retry", (dialog, which) -> web.loadUrl(retry))
            .setNegativeButton("Close", null).show();
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "No browser is available to open this link.", Toast.LENGTH_LONG).show();
        }
    }

    private void load(String path) {
        web.loadUrl(TwendeRoutes.ORIGIN + path);
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        web.saveState(state);
        super.onSaveInstanceState(state);
    }

    @Override
    protected void onDestroy() {
        if (loadError != null) loadError.dismiss();
        if (web != null) {
            ((FrameLayout) web.getParent()).removeView(web);
            web.destroy();
        }
        super.onDestroy();
    }
}
