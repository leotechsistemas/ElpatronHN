package com.patron.erp.controller;

import com.patron.erp.dto.request.UserRequest;
import com.patron.erp.dto.response.UserResponse;
import com.patron.erp.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('Admin','Vendedor','Produccion','Analista')")
    public ResponseEntity<List<UserResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('Admin','Vendedor','Produccion','Analista')")
    public ResponseEntity<List<UserResponse>> findAllActive() {
        return ResponseEntity.ok(service.findAllActive());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Vendedor','Produccion','Analista')")
    public ResponseEntity<UserResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<UserResponse> update(@PathVariable String id, @Valid @RequestBody UserRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<UserResponse> toggle(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(service.toggle(id, body.getOrDefault("activo", null)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats/departments")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Map<String, Long>> getDepartmentStats() {
        return ResponseEntity.ok(service.getDepartmentStats());
    }

    @GetMapping("/stats/positions")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Map<String, Long>> getPositionStats() {
        return ResponseEntity.ok(service.getPositionStats());
    }

    @GetMapping("/stats/active-count")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Map<String, Long>> getActiveCount() {
        return ResponseEntity.ok(Map.of("count", service.getActiveCount()));
    }
}
