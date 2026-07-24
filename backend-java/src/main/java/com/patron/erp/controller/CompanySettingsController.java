package com.patron.erp.controller;

import com.patron.erp.dto.CompanySettingsRequest;
import com.patron.erp.model.CompanySettings;
import com.patron.erp.service.CompanySettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company-settings")
public class CompanySettingsController {

    private final CompanySettingsService service;

    public CompanySettingsController(CompanySettingsService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<CompanySettings> get() {
        return ResponseEntity.ok(service.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<CompanySettings> update(@Valid @RequestBody CompanySettingsRequest req) {
        return ResponseEntity.ok(service.updateSettings(req));
    }
}
