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

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class SecurityConfigIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        userRepository.deleteAll();
    }

    @Test
    void anonymousUserCannotAccessStatesAndCities() throws Exception {
        int statesStatus = mvc.perform(get("/states"))
                .andReturn()
                .getResponse()
                .getStatus();

        int citiesStatus = mvc.perform(get("/cities"))
                .andReturn()
                .getResponse()
                .getStatus();

        assertTrue(statesStatus == 401 || statesStatus == 403);
        assertTrue(citiesStatus == 401 || citiesStatus == 403);
    }

    @Test
    void authenticatedUserCanAccessStatesAndCities() throws Exception {
        Cookie session = loginAndGetSessionCookie();

        mvc.perform(get("/states").cookie(session))
                .andExpect(status().isOk());

        mvc.perform(get("/cities").cookie(session))
                .andExpect(status().isOk());
    }

    private Cookie loginAndGetSessionCookie() throws Exception {
        createAdminUser();

        MvcResult result = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "password": "admin"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Cookie cookie = result.getResponse().getCookie(AuthController.SESSION_COOKIE);
        assertNotNull(cookie, "login should set the session cookie");
        return cookie;
    }

    private void createAdminUser() {
        User user = new User();
        user.setUsername("admin");
        user.setPassword(passwordEncoder.encode("admin"));
        user.setRole("ADMIN");
        userRepository.save(user);
    }
}
