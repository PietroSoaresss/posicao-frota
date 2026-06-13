package br.com.pavi.api.auth;

public record AuthResponse(
        String token,
        String username,
        String role
) {
}
