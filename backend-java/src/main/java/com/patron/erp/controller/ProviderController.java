package com.patron.erp.controller;

import com.patron.erp.dto.request.ProviderRequest;
import com.patron.erp.dto.response.ProviderResponse;
import com.patron.erp.service.ProviderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/providers")
public class ProviderController {
    private final ProviderService service;
    public ProviderController(ProviderService service) { this.service = service; }

    @GetMapping public ResponseEntity<List<ProviderResponse>> findAll() { return ResponseEntity.ok(service.findAll()); }
    @GetMapping("/{id}") public ResponseEntity<ProviderResponse> findById(@PathVariable String id) { return ResponseEntity.ok(service.findById(id)); }
    @PostMapping @PreAuthorize("hasRole('Admin')") public ResponseEntity<ProviderResponse> create(@Valid @RequestBody ProviderRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req)); }
    @PutMapping("/{id}") @PreAuthorize("hasRole('Admin')") public ResponseEntity<ProviderResponse> update(@PathVariable String id, @Valid @RequestBody ProviderRequest req) { return ResponseEntity.ok(service.update(id, req)); }
    @DeleteMapping("/{id}") @PreAuthorize("hasRole('Admin')") public ResponseEntity<Void> delete(@PathVariable String id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
