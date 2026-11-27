package com.modernmindsettechnologies.twende;

import static org.junit.Assert.*;

import org.junit.Test;

public final class TwendeRoutesTest {
    private static final String ORIGIN = TwendeRoutes.ORIGIN;

    @Test
    public void startsOnTheSameWelcomePageAsTheWebsite() {
        assertEquals("/", TwendeRoutes.START);
        assertTrue(TwendeRoutes.allowed(ORIGIN + TwendeRoutes.START));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/signup"));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/login"));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/home"));
        assertTrue(TwendeRoutes.allowed(ORIGIN + "/pay?bus=0012"));
        assertFalse(TwendeRoutes.allowed(ORIGIN + "/business"));
        assertFalse(TwendeRoutes.allowed(ORIGIN + "/home/%2e%2e/business"));
        assertFalse(TwendeRoutes.allowed(ORIGIN + ".example.org/login"));
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
