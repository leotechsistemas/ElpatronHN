package com.patron.erp.controller;

import com.patron.erp.dto.request.ProductionTaskRequest;
import com.patron.erp.dto.response.ProductionTaskResponse;
import com.patron.erp.service.ProductionTaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/production-tasks")
public class ProductionTaskController {
    private final ProductionTaskService service;
    public ProductionTaskController(ProductionTaskService service) { this.service = service; }

    @GetMapping @PreAuthorize("hasAnyRole('Admin','Produccion')")
    public ResponseEntity<List<ProductionTaskResponse>> findAll() { return ResponseEntity.ok(service.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<ProductionTaskResponse> findById(@PathVariable String id) { return ResponseEntity.ok(service.findById(id)); }

    @GetMapping("/by-venta/{ventaId}")
    public ResponseEntity<List<ProductionTaskResponse>> findByVenta(@PathVariable String ventaId) { return ResponseEntity.ok(service.findByVenta(ventaId)); }

    @GetMapping("/estadisticas")
    @PreAuthorize("hasAnyRole('Admin','Produccion')")
    public ResponseEntity<Map<String, Object>> getEstadisticas() { return ResponseEntity.ok(service.getEstadisticas()); }

    @PostMapping @PreAuthorize("hasAnyRole('Admin','Produccion')")
    public ResponseEntity<ProductionTaskResponse> create(@Valid @RequestBody ProductionTaskRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Produccion')")
    public ResponseEntity<ProductionTaskResponse> update(@PathVariable String id, @Valid @RequestBody ProductionTaskRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('Admin','Produccion')")
    public ResponseEntity<ProductionTaskResponse> updateEstado(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateEstado(id, body.get("estado")));
    }
}
