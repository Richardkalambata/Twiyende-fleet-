package com.modernmindsettechnologies.twende;

import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

final class TwendeRoutes {
    static final String ORIGIN = "https://twende-fleet-refresh.richardkalambata495.workers.dev";
    static final String START = "/";
    private static final String HOST = URI.create(ORIGIN).getHost();
    private static final List<String> RIDER_ROUTES = Arrays.asList(
        "", "welcome", "login", "signup", "home", "pay", "topup", "wallet", "map",
        "rides", "receipt", "profile", "lost", "notifications", "help", "terms", "privacy"
    );
    private static final List<String> FARE_HOSTS = Arrays.asList(
        HOST, "twende-fleet-refresh.vercel.app", "twende-zm.vercel.app"
    );

    private TwendeRoutes() {}

    static boolean sameOrigin(String url) {
        URI uri = parse(url);
        return safeHttps(uri) && HOST.equalsIgnoreCase(uri.getHost());
    }

    static boolean allowed(String url) {
        URI uri = parse(url);
        if (uri == null || !sameOrigin(url)) return false;
        String path = uri.normalize().getPath();
        if (path == null || path.contains("\\") || path.contains("..") || path.startsWith("//")) return false;
        String section = path.isEmpty() ? "" : path.substring(1).split("/", 2)[0];
        return RIDER_ROUTES.contains(section);
    }

    static boolean canOpenScanner(String page, String sourceOrigin, boolean mainFrame, String message) {
        if (!mainFrame || !"scan".equals(message) || !sameOrigin(sourceOrigin) || !allowed(page)) return false;
        return "/pay".equals(URI.create(page).getPath());
    }

    static String scannedFarePath(String code) {
        URI uri = parse(code);
        if (!safeHttps(uri) || uri.getHost() == null || !FARE_HOSTS.contains(uri.getHost().toLowerCase(Locale.ROOT))
                || uri.getRawFragment() != null || !Arrays.asList("/pay", "/login", "/home").contains(uri.getPath())) return null;
        String query = uri.getRawQuery();
        return query != null && query.matches("bus=[0-9]{1,4}") ? "/pay?" + query : null;
    }

    private static URI parse(String url) {
        if (url == null) return null;
        try {
            return URI.create(url);
        } catch (IllegalArgumentException error) {
            return null;
        }
    }

    private static boolean safeHttps(URI uri) {
        return uri != null && "https".equalsIgnoreCase(uri.getScheme()) && uri.getRawUserInfo() == null
            && (uri.getPort() == -1 || uri.getPort() == 443);
    }
}
