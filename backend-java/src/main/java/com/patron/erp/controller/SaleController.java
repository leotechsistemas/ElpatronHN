package com.patron.erp.controller;

import com.patron.erp.dto.request.SaleCompleteRequest;
import com.patron.erp.dto.request.SaleRequest;
import com.patron.erp.dto.response.PageResponse;
import com.patron.erp.dto.response.SaleCompleteResponse;
import com.patron.erp.dto.response.SaleResponse;
import com.patron.erp.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.patron.erp.util.MonetaryUtil;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
public class SaleController {
    private final SaleService service;
    public SaleController(SaleService service) { this.service = service; }

    @GetMapping @PreAuthorize("hasAnyRole('Admin','Vendedor','Analista')")
    public ResponseEntity<?> findAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String estadoPago,
            @RequestParam(required = false) String clienteId) {
        if (page != null) {
            return ResponseEntity.ok(service.findAll(page, size, search, estado, estadoPago, clienteId));
        }
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('Admin','Vendedor','Analista')")
    public ResponseEntity<SaleResponse> findById(@PathVariable String id) { return ResponseEntity.ok(service.findById(id)); }

    @PostMapping @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PostMapping("/complete") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<SaleCompleteResponse> createComplete(@Valid @RequestBody SaleCompleteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createComplete(req));
    }

    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<SaleResponse> update(@PathVariable String id, @Valid @RequestBody SaleRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<SaleResponse> patch(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.patchStatus(id, body.getOrDefault("estado", "")));
    }

    @PatchMapping("/{id}/recalc-status") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<SaleResponse> recalcStatus(@PathVariable String id) {
        return ResponseEntity.ok(service.recalcStatus(id));
    }

    @PostMapping("/convert-from-quotation/{quoteId}") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<SaleCompleteResponse> convertFromQuotation(
            @PathVariable String quoteId,
            @RequestBody Map<String, Object> body) {
        Long pagoInicial = body.containsKey("pago_inicial")
                ? MonetaryUtil.toCents(((Number) body.get("pago_inicial")).doubleValue()) : 0L;
        String metodoPago = body.containsKey("metodo_pago")
                ? String.valueOf(body.get("metodo_pago")) : "Efectivo";
        String vendedorId = body.containsKey("vendedor_id")
                ? String.valueOf(body.get("vendedor_id")) : "";
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.convertFromQuotation(quoteId, pagoInicial, metodoPago, vendedorId));
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> delete(@PathVariable String id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
