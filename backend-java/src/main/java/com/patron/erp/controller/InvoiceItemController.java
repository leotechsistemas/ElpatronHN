package com.patron.erp.controller;

import com.patron.erp.dto.request.InvoiceItemRequest;
import com.patron.erp.dto.response.InvoiceItemResponse;
import com.patron.erp.service.InvoiceItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoice-items")
public class InvoiceItemController {
    private final InvoiceItemService service;
    public InvoiceItemController(InvoiceItemService service) { this.service = service; }

    @GetMapping("/by-sale/{ventaId}") @PreAuthorize("hasAnyRole('Admin','Vendedor','Analista')")
    public ResponseEntity<List<InvoiceItemResponse>> findByVentaId(@PathVariable String ventaId) {
        return ResponseEntity.ok(service.findByVentaId(ventaId));
    }

    @PostMapping @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<InvoiceItemResponse> create(@Valid @RequestBody InvoiceItemRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<InvoiceItemResponse> update(@PathVariable String id, @Valid @RequestBody InvoiceItemRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<Void> delete(@PathVariable String id) { service.delete(id); return ResponseEntity.noContent().build(); }

    @DeleteMapping("/by-sale/{ventaId}") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<Void> deleteByVentaId(@PathVariable String ventaId) { service.deleteByVentaId(ventaId); return ResponseEntity.noContent().build(); }
}
