package com.patron.erp.controller;

import com.patron.erp.config.JwtUtil;
import com.patron.erp.dto.AuthResponse;
import com.patron.erp.dto.LoginRequest;
import com.patron.erp.model.User;
import com.patron.erp.service.AuthService;
import com.patron.erp.service.TokenBlacklistService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService blacklistService;
    private final boolean cookieSecure;

    public AuthController(AuthService authService,
                          JwtUtil jwtUtil,
                          TokenBlacklistService blacklistService,
                          @org.springframework.beans.factory.annotation.Value("${app.cookie.secure}") boolean cookieSecure) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.blacklistService = blacklistService;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse res = authService.authenticate(request);
        ResponseCookie cookie = ResponseCookie.from("jwt", res.getToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(1))
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(res);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        String token = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                if ("jwt".equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }
        if (token != null && jwtUtil.validateToken(token)) {
            String jti = jwtUtil.getTokenId(token);
            blacklistService.invalidate(jti, jwtUtil.getExpirationMs());
        }

        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("mensaje", "Sesión finalizada"));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getUserInfo(user.getEmail()));
    }
}
