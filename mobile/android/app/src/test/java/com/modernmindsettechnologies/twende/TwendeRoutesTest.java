package com.modernmindsettechnologies.twende;

import static org.junit.Assert.*;

import org.junit.Test;

public final class TwendeRoutesTest {
    private static final String ORIGIN = TwendeRoutes.ORIGIN;

    @Test
    public void startsOnTheSameWelcomePageAsTheWebsite() {
        assertEquals("/", TwendeRoutes.start(false, null));
        assertEquals("/login", TwendeRoutes.start(false, "passenger"));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/signup", false));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/login?created=1&bus=0012", false));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/home", false));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/pay?bus=0012", false));
        assertFalse(TwendeRoutes.allowed(ORIGIN + "/business", false));
        assertFalse(TwendeRoutes.allowed(ORIGIN + "/home/%2e%2e/business", false));
        assertFalse(TwendeRoutes.allowed(ORIGIN + ".example.org/login", false));
    }

    @Test
    public void fleetReturnsToTheLastSignedInRole() {
        assertEquals("/business", TwendeRoutes.start(true, null));
        assertEquals("/business/login", TwendeRoutes.start(true, "operator"));
        assertEquals("/business/conductor/login", TwendeRoutes.start(true, "conductor"));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/business/signup", true));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/business/conductor/login?forgot=1", true));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/bus-sign/12", true));
        assertFalse(TwendeRoutes.allowed(ORIGIN + "/pay?bus=12", true));
        assertNull(TwendeRoutes.signedInRole(ORIGIN + "/business/conductor/login", true));
        assertEquals("conductor", TwendeRoutes.signedInRole(ORIGIN + "/business/drive/profile", true));
        assertEquals("operator", TwendeRoutes.signedInRole(ORIGIN + "/business/desk", true));
    }

    @Test
    public void knownSessionGoesStraightToTheDashboard() {
        assertEquals("/home", TwendeRoutes.launch(false, null, "twende_rider_session=sample"));
        assertEquals("/login", TwendeRoutes.launch(false, "passenger", null));
        assertEquals("/business/desk", TwendeRoutes.launch(true, "operator", "twende_operator_session=sample"));
        assertEquals("/business/conductor/login", TwendeRoutes.launch(true, "conductor", "twende_operator_session=sample"));
        assertEquals("/business/drive", TwendeRoutes.launch(true, "conductor", "other=x; twende_conductor_session=sample"));
    }

    @Test
    public void nativeScannerOnlyOpensFromTheRiderFarePage() {
        assertTrue(TwendeRoutes.canOpenScanner(ORIGIN + "/pay", ORIGIN, true, "scan"));
        assertTrue(TwendeRoutes.canOpenScanner(ORIGIN + "/pay?bus=12", ORIGIN, true, "scan"));
        assertFalse(TwendeRoutes.canOpenScanner(ORIGIN + "/login", ORIGIN, true, "scan"));
        assertFalse(TwendeRoutes.canOpenScanner(ORIGIN + "/signup", ORIGIN, true, "scan"));
        assertFalse(TwendeRoutes.canOpenScanner(ORIGIN + "/home", ORIGIN, true, "scan"));
        assertFalse(TwendeRoutes.canOpenScanner(ORIGIN + "/pay", ORIGIN, false, "scan"));
        assertFalse(TwendeRoutes.canOpenScanner(ORIGIN + "/pay", "https://example.org", true, "scan"));
        assertFalse(TwendeRoutes.canOpenScanner(ORIGIN + "/pay", ORIGIN, true, "other"));
    }

    @Test
    public void qrCodesResolveToVerifiedBusNumbers() {
        assertEquals("/pay?bus=0000", TwendeRoutes.scannedFarePath(ORIGIN + "/pay?bus=0000"));
        assertEquals("/pay?bus=12", TwendeRoutes.scannedFarePath("https://twende-zm.vercel.app/login?bus=12"));
        assertNull(TwendeRoutes.scannedFarePath(ORIGIN + "/pay?bus=12&bus=13"));
        assertNull(TwendeRoutes.scannedFarePath(ORIGIN + "/pay?bus=12#redirect"));
        assertNull(TwendeRoutes.scannedFarePath("https://example.org/pay?bus=12"));
    }
}
