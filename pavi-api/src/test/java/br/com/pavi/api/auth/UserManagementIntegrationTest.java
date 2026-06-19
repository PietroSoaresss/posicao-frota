package br.com.pavi.api.auth;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class UserManagementIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        userRepository.deleteAll();
        createUser("admin", "admin", "ADMIN");
        createUser("operador", "operador", "OPERADOR");
    }

    @Test
    void loginSetsHttpOnlySessionCookieAndReturnsProfile() throws Exception {
        MvcResult result = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "password": "admin"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andReturn();

        Cookie cookie = result.getResponse().getCookie(AuthController.SESSION_COOKIE);
        assertNotNull(cookie, "login should set the session cookie");
        assertTrue(cookie.isHttpOnly(), "session cookie must be HttpOnly");
        assertTrue(cookie.getValue() != null && !cookie.getValue().isBlank(), "session cookie value must be set");
    }

    @Test
    void adminCanListUsersWithoutPassword() throws Exception {
        mvc.perform(get("/users").cookie(loginCookie("admin", "admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").exists())
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    void adminCanCreateUserAndPasswordIsEncoded() throws Exception {
        mvc.perform(post("/users")
                        .cookie(loginCookie("admin", "admin"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "novo-operador",
                                  "password": "segredo1",
                                  "role": "OPERADOR"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("novo-operador"))
                .andExpect(jsonPath("$.role").value("OPERADOR"))
                .andExpect(jsonPath("$.password").doesNotExist());

        User created = userRepository.findByUsername("novo-operador").orElseThrow();
        assertNotEquals("segredo1", created.getPassword());
        assertTrue(passwordEncoder.matches("segredo1", created.getPassword()));
    }

    @Test
    void operatorCannotAccessUsersModule() throws Exception {
        mvc.perform(get("/users").cookie(loginCookie("operador", "operador")))
                .andExpect(status().isForbidden());
    }

    @Test
    void createAndUpdateRejectDuplicateUsername() throws Exception {
        Cookie adminCookie = loginCookie("admin", "admin");

        mvc.perform(post("/users")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "password": "segredo1",
                                  "role": "OPERADOR"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Username já está em uso."));

        User operador = userRepository.findByUsername("operador").orElseThrow();

        mvc.perform(put("/users/{id}", operador.getId())
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "role": "OPERADOR"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Username já está em uso."));
    }

    @Test
    void adminCannotDeleteOwnUser() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();

        mvc.perform(delete("/users/{id}", admin.getId())
                        .cookie(loginCookie("admin", "admin")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Você não pode excluir o próprio usuário."));
    }

    @Test
    void adminCannotDemoteOwnRole() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();

        mvc.perform(put("/users/{id}", admin.getId())
                        .cookie(loginCookie("admin", "admin"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "role": "OPERADOR"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Você não pode rebaixar o próprio usuário para OPERADOR."));
    }

    private Cookie loginCookie(String username, String password) throws Exception {
        MvcResult result = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie cookie = result.getResponse().getCookie(AuthController.SESSION_COOKIE);
        assertNotNull(cookie, "login should set the session cookie");
        return cookie;
    }

    private void createUser(String username, String password, String role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        userRepository.save(user);
    }
}
