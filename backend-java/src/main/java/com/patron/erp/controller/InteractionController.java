package com.patron.erp.controller;

import com.patron.erp.dto.request.InteractionRequest;
import com.patron.erp.dto.response.InteractionResponse;
import com.patron.erp.service.InteractionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/interactions")
public class InteractionController {

    private final InteractionService service;

    public InteractionController(InteractionService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<List<InteractionResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<InteractionResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<InteractionResponse> create(@Valid @RequestBody InteractionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }
}
