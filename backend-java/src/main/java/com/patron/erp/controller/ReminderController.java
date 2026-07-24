package com.patron.erp.controller;

import com.patron.erp.dto.request.ReminderRequest;
import com.patron.erp.dto.response.ReminderResponse;
import com.patron.erp.service.ReminderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService service;

    public ReminderController(ReminderService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<List<ReminderResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<ReminderResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<ReminderResponse> create(@Valid @RequestBody ReminderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<ReminderResponse> complete(@PathVariable String id) {
        return ResponseEntity.ok(service.complete(id));
    }
}
