package com.patron.erp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    public void invalidate(String jti, long expirationMs) {
        blacklist.put(jti, System.currentTimeMillis() + expirationMs);
        log.info("Token {} invalidado", jti.substring(0, 8) + "...");
    }

    public boolean isBlacklisted(String jti) {
        Long expiry = blacklist.get(jti);
        if (expiry == null) return false;
        if (System.currentTimeMillis() > expiry) {
            blacklist.remove(jti);
            return false;
        }
        return true;
    }

    @Scheduled(fixedRate = 300_000)
    public void cleanExpired() {
        long now = System.currentTimeMillis();
        blacklist.entrySet().removeIf(e -> now > e.getValue());
    }
}
