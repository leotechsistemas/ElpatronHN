package com.patron.erp.controller;

import com.patron.erp.dto.request.StockLogRequest;
import com.patron.erp.dto.response.StockLogResponse;
import com.patron.erp.service.StockLogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stock-logs")
public class StockLogController {

    private final StockLogService service;

    public StockLogController(StockLogService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('Admin','Produccion')")
    public ResponseEntity<List<StockLogResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Produccion')")
    public ResponseEntity<StockLogResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Produccion')")
    public ResponseEntity<StockLogResponse> create(@Valid @RequestBody StockLogRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }
}
