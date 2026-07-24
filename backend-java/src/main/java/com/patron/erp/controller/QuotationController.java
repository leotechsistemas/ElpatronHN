package com.patron.erp.controller;

import com.patron.erp.dto.request.QuotationRequest;
import com.patron.erp.dto.response.QuotationResponse;
import com.patron.erp.service.QuotationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/quotations")
public class QuotationController {
    private final QuotationService service;
    public QuotationController(QuotationService service) { this.service = service; }

    @GetMapping @PreAuthorize("hasAnyRole('Admin','Vendedor','Analista')")
    public ResponseEntity<Page<QuotationResponse>> findAll(
            @RequestParam(defaultValue = "pendiente") String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(service.findAll(estado, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuotationResponse> findById(@PathVariable String id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<QuotationResponse> create(@Valid @RequestBody QuotationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<QuotationResponse> update(@PathVariable String id, @Valid @RequestBody QuotationRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PatchMapping("/{id}") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<QuotationResponse> patch(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(service.patch(id, updates));
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> delete(@PathVariable String id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
