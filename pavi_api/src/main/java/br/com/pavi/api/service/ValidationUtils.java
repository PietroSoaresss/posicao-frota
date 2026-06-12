package br.com.pavi.api.service;

final class ValidationUtils {

    private ValidationUtils() {
    }

    static Long requiredReferenceId(String fieldName, Long id) {
        if (id == null) {
            throw new IllegalArgumentException(fieldName + ".id is required");
        }
        return id;
    }
}
