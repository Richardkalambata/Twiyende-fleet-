package com.modernmindsettechnologies.twende;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import org.json.JSONException;
import org.json.JSONObject;

final class BusSignExport {
    private static final String PNG_PREFIX = "data:image/png;base64,";
    private static final int MAX_MESSAGE = 4_200_000;
    private static final byte[] PNG_SIGNATURE = {(byte) 137, 80, 78, 71, 13, 10, 26, 10};

    private BusSignExport() {}

    static void handle(Activity activity, WebView view, String message) {
        if (message == null || message.length() > MAX_MESSAGE) return;
        if ("print".equals(message)) {
            PrintManager manager = activity.getSystemService(PrintManager.class);
            if (manager == null) return;
            manager.print("Twende bus sign", view.createPrintDocumentAdapter("Twende bus sign"),
                    new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
            return;
        }
        try {
            JSONObject data = new JSONObject(message);
            String name = data.optString("filename");
            String image = data.optString("image");
            if (!name.matches("twende-bus-[0-9]{1,4}\\.png") || !image.startsWith(PNG_PREFIX)) return;
            byte[] png = Base64.decode(image.substring(PNG_PREFIX.length()), Base64.NO_WRAP);
            if (png.length < PNG_SIGNATURE.length) return;
            for (int i = 0; i < PNG_SIGNATURE.length; i++) {
                if (png[i] != PNG_SIGNATURE[i]) return;
            }
            File directory = new File(activity.getCacheDir(), "bus-signs");
            if (!directory.isDirectory() && !directory.mkdirs()) throw new IOException("Could not open export folder");
            File file = new File(directory, name);
            try (FileOutputStream output = new FileOutputStream(file)) {
                output.write(png);
            }
            var uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".bus-signs", file);
            var share = new Intent(Intent.ACTION_SEND).setType("image/png").putExtra(Intent.EXTRA_STREAM, uri)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(Intent.createChooser(share, "Save or share bus sign"));
        } catch (JSONException | IllegalArgumentException | IOException | ActivityNotFoundException error) {
            Toast.makeText(activity, "Could not share this sign. Try again.", Toast.LENGTH_LONG).show();
        }
    }
}
