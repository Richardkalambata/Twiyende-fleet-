package com.modernmindsettechnologies.twende;

import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

final class TwendeRoutes {
    static final String ORIGIN = "https://twende-fleet-refresh.richardkalambata495.workers.dev";
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

    static String start(boolean fleet, String role) {
        if (fleet) {
            if ("conductor".equals(role)) return "/business/conductor/login";
            return "operator".equals(role) ? "/business/login" : "/business";
        }
        return "passenger".equals(role) ? "/login" : "/";
    }

    static String launch(boolean fleet, String rememberedRole, String cookies) {
        String role = rememberedRole;
        if (role == null && !fleet && hasCookie(cookies, "twende_rider_session")) role = "passenger";
        if (!fleet && "passenger".equals(role) && hasCookie(cookies, "twende_rider_session")) return "/home";
        if (fleet && "operator".equals(role) && hasCookie(cookies, "twende_operator_session")) return "/business/desk";
        if (fleet && "conductor".equals(role) && hasCookie(cookies, "twende_conductor_session")) return "/business/drive";
        return start(fleet, role);
    }

    private static boolean hasCookie(String cookies, String name) {
        if (cookies == null) return false;
        for (String cookie : cookies.split(";")) {
            if (cookie.trim().startsWith(name + "=")) return true;
        }
        return false;
    }

    static boolean isWelcome(String url, boolean fleet) {
        URI uri = parse(url);
        return sameOrigin(url) && (fleet ? "/business" : "/").equals(uri.getPath());
    }

    static String signedInRole(String url, boolean fleet) {
        if (!allowed(url, fleet)) return null;
        String path = URI.create(url).getPath();
        if (fleet) {
            if (path.equals("/business/desk") || path.startsWith("/business/desk/")) return "operator";
            if (path.equals("/business/drive") || path.startsWith("/business/drive/")) return "conductor";
            return null;
        }
        String section = path.isEmpty() ? "" : path.substring(1).split("/", 2)[0];
        return Arrays.asList("home", "pay", "topup", "wallet", "map", "rides", "receipt", "profile",
                "lost", "notifications", "help").contains(section) ? "passenger" : null;
    }

    static boolean allowed(String url, boolean fleet) {
        URI uri = parse(url);
        if (uri == null || !sameOrigin(url)) return false;
        String path = uri.getPath();
        if (path == null || path.contains("\\") || path.contains("..") || path.startsWith("//")
                || !uri.normalize().getPath().equals(path)) return false;
        String encoded = uri.getRawPath().toLowerCase(Locale.ROOT);
        if (encoded.contains("%2f") || encoded.contains("%5c") || encoded.contains("%2e")) return false;
        String section = path.isEmpty() ? "" : path.substring(1).split("/", 2)[0];
        if (fleet) return Arrays.asList("business", "bus-sign", "terms", "privacy").contains(section)
                || "/api/export".equals(path);
        return RIDER_ROUTES.contains(section);
    }

    static boolean canOpenScanner(String page, String sourceOrigin, boolean mainFrame, String message) {
        if (!mainFrame || !"scan".equals(message) || !sameOrigin(sourceOrigin) || !allowed(page, false)) return false;
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
