package br.com.pavi.api;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;

class CleanupArchitectureTest {

    @Test
    void referenceDataBootstrapClassIsRemoved() {
        assertFalse(isPresent("br.com.pavi.api.auth.ReferenceDataBootstrap"));
    }

    @Test
    void portFallbackCustomizerClassIsRemoved() {
        assertFalse(isPresent("br.com.pavi.api.config.PortFallbackCustomizer"));
    }

    private boolean isPresent(String className) {
        try {
            Class.forName(className);
            return true;
        } catch (ClassNotFoundException ignored) {
            return false;
        }
    }
}
