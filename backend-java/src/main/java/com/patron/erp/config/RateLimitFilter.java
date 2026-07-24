package com.patron.erp.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1)
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 60_000;
    private final ConcurrentHashMap<String, long[]> attempts = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        if ("/api/auth/login".equals(req.getRequestURI()) && "POST".equalsIgnoreCase(req.getMethod())) {
            String ip = getClientIp(req);
            long now = System.currentTimeMillis();
            long[] entry = attempts.compute(ip, (k, v) -> {
                if (v == null || now - v[0] > WINDOW_MS) {
                    return new long[]{now, 1};
                }
                v[1]++;
                return v;
            });

            if (entry[1] > MAX_ATTEMPTS) {
                log.warn("Rate limit excedido para IP: {}", ip);
                res.setStatus(429);
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"Demasiados intentos. Espera 1 minuto.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
