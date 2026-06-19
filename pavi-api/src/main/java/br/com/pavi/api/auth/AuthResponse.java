package br.com.pavi.api.auth;

public record AuthResponse(
        String username,
        String role
) {
}
