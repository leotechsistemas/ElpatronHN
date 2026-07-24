package com.patron.erp.service;

import com.patron.erp.config.JwtUtil;
import com.patron.erp.dto.AuthResponse;
import com.patron.erp.dto.LoginRequest;
import com.patron.erp.model.User;
import com.patron.erp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 15;
    private static final long PASSWORD_EXPIRATION_DAYS = 90;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse authenticate(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        if (!user.getActive()) {
            throw new BadCredentialsException("Credenciales inválidas");
        }

        if (user.getLockedUntil() != null && LocalDateTime.now().isBefore(user.getLockedUntil())) {
            long remain = java.time.Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes();
            throw new BadCredentialsException("Cuenta bloqueada. Intenta en " + remain + " minutos.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            int attempts = (user.getFailedAttempts() == null ? 0 : user.getFailedAttempts()) + 1;
            user.setFailedAttempts(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
                log.warn("Cuenta bloqueada por {} intentos fallidos: {}", MAX_FAILED_ATTEMPTS, user.getEmail());
            }
            userRepository.save(user);
            throw new BadCredentialsException("Credenciales inválidas");
        }

        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        if (Boolean.TRUE.equals(user.getPasswordExpired())) {
            throw new BadCredentialsException("Contraseña expirada. Debes cambiarla.");
        }

        if (user.getLastPasswordChange() != null) {
            long daysSinceChange = java.time.Duration.between(
                    user.getLastPasswordChange().atStartOfDay(), LocalDateTime.now()).toDays();
            if (daysSinceChange >= PASSWORD_EXPIRATION_DAYS) {
                user.setPasswordExpired(true);
                userRepository.save(user);
                throw new BadCredentialsException("Contraseña expirada. Debes cambiarla.");
            }
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(user.getId(), token, user.getName(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse getUserInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return new AuthResponse(user.getId(), null, user.getName(), user.getEmail(), user.getRole().name());
    }
}
