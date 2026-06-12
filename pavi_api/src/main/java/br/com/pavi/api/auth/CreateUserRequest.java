package br.com.pavi.api.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "username is required")
        String username,

        @NotBlank(message = "password is required")
        @Size(min = 6, message = "password must have at least 6 characters")
        String password,

        @NotBlank(message = "role is required")
        String role
) {
}
