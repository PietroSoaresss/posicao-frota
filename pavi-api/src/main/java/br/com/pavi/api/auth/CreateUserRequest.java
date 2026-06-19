package br.com.pavi.api.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "username is required")
        @Size(min = 3, max = 60, message = "username must have 3-60 characters")
        String username,

        @NotBlank(message = "password is required")
        @Size(min = 8, max = 128, message = "password must have at least 8 characters")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                message = "password must contain at least one letter and one number"
        )
        String password,

        @NotBlank(message = "role is required")
        String role,

        String color
) {
}
