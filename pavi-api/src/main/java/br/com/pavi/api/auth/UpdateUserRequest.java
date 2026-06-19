package br.com.pavi.api.auth;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserRequest(
        @NotBlank(message = "username is required")
        String username,

        @NotBlank(message = "role is required")
        String role,

        String color
) {
}
