package br.com.pavi.api.config;

import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RateLimitFilterTest {

    @Test
    void returnsTooManyRequestsWhenClientExceedsLimit() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(2, Duration.ofMinutes(1));

        MockHttpServletResponse first = perform(filter);
        MockHttpServletResponse second = perform(filter);
        MockHttpServletResponse third = perform(filter);

        assertEquals(HttpServletResponse.SC_OK, first.getStatus());
        assertEquals(HttpServletResponse.SC_OK, second.getStatus());
        assertEquals(429, third.getStatus());
    }

    @Test
    void tracksClientsIndependentlyByForwardedIp() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(1, Duration.ofMinutes(1));

        MockHttpServletResponse firstClient = perform(filter, "203.0.113.10");
        MockHttpServletResponse secondClient = perform(filter, "203.0.113.20");
        MockHttpServletResponse firstClientAgain = perform(filter, "203.0.113.10");

        assertEquals(HttpServletResponse.SC_OK, firstClient.getStatus());
        assertEquals(HttpServletResponse.SC_OK, secondClient.getStatus());
        assertEquals(429, firstClientAgain.getStatus());
    }

    private MockHttpServletResponse perform(RateLimitFilter filter) throws Exception {
        return perform(filter, "203.0.113.10");
    }

    private MockHttpServletResponse perform(RateLimitFilter filter, String forwardedFor) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/states");
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", forwardedFor);

        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
