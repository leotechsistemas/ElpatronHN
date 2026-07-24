package com.patron.erp.controller;

import com.patron.erp.dto.response.LeadResponse;
import com.patron.erp.service.LeadService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/leads")
public class LeadController {
    private final LeadService service;

    public LeadController(LeadService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<List<LeadResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<LeadResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
