package com.patron.erp.controller;

import com.patron.erp.dto.request.ServiceTypeRequest;
import com.patron.erp.dto.response.ServiceTypeResponse;
import com.patron.erp.service.ServiceTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/service-types")
public class ServiceTypeController {

    private final ServiceTypeService service;

    public ServiceTypeController(ServiceTypeService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<ServiceTypeResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/activos")
    public ResponseEntity<List<ServiceTypeResponse>> findActivos() {
        return ResponseEntity.ok(service.findActivos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceTypeResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ServiceTypeResponse> create(@Valid @RequestBody ServiceTypeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ServiceTypeResponse> update(@PathVariable String id, @Valid @RequestBody ServiceTypeRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ServiceTypeResponse> toggleActivo(@PathVariable String id) {
        return ResponseEntity.ok(service.toggleActivo(id));
    }
}
