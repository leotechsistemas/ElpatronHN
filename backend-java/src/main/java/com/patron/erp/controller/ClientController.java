package com.patron.erp.controller;

import com.patron.erp.dto.request.ClientRequest;
import com.patron.erp.dto.response.ClientResponse;
import com.patron.erp.dto.response.PageResponse;
import com.patron.erp.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService service;

    public ClientController(ClientService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<?> findAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String clasificacion) {
        if (page != null) {
            return ResponseEntity.ok(service.findAll(page, size, search, clasificacion));
        }
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientResponse> findById(@PathVariable String id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<ClientResponse> create(@Valid @RequestBody ClientRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<ClientResponse> update(@PathVariable String id, @Valid @RequestBody ClientRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> delete(@PathVariable String id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
