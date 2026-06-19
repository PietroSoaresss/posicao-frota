package br.com.pavi.api.auth;

public record UserResponse(
        Long id,
        String username,
        String role,
        String color
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole(), user.getColor());
    }
}
