package br.com.pavi.api.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Duration;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    public static final String SESSION_COOKIE = "pavi_session";

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final TokenBlacklistService blacklist;
    private final String cookieSameSite;
    private final boolean cookieSecure;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          UserRepository userRepository,
                          TokenBlacklistService blacklist,
                          @Value("${app.session.cookie-same-site:Strict}") String cookieSameSite,
                          @Value("${app.session.cookie-secure:false}") boolean cookieSecure) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.blacklist = blacklist;
        this.cookieSameSite = cookieSameSite;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.isBlank() || password == null || password.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuário ou senha inválidos."));
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuário ou senha inválidos."));
        }

        String token = jwtUtil.generateToken(username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado."));

        ResponseCookie cookie = buildSessionCookie(token, Duration.ofMillis(jwtUtil.getExpirationMs()));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse(user.getUsername(), user.getRole()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String token = readTokenFromRequest(request);
        if (token != null) {
            try {
                String jti = jwtUtil.extractJti(token);
                Date exp = jwtUtil.extractExpiration(token);
                blacklist.revoke(jti, exp);
            } catch (Exception ignored) {
                // Token inválido / expirado — nada para revogar.
            }
        }
        ResponseCookie cleared = buildSessionCookie("", Duration.ZERO);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cleared.toString())
                .build();
    }

    /** Returns the current authenticated user (used by the SPA to restore session on page load). */
    @GetMapping("/me")
    public AuthResponse me(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado."));
        return new AuthResponse(user.getUsername(), user.getRole());
    }

    private ResponseCookie buildSessionCookie(String value, Duration maxAge) {
        return ResponseCookie.from(SESSION_COOKIE, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private String readTokenFromRequest(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if (SESSION_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
