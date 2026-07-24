package com.patron.erp.controller;

import com.patron.erp.dto.request.PaymentCreateRequest;
import com.patron.erp.dto.response.PageResponse;
import com.patron.erp.dto.response.PaymentResponse;
import com.patron.erp.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService service;
    public PaymentController(PaymentService service) { this.service = service; }

    @GetMapping @PreAuthorize("hasAnyRole('Admin','Vendedor','Analista')")
    public ResponseEntity<?> findAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String metodo,
            @RequestParam(required = false) String estado) {
        if (page != null) {
            return ResponseEntity.ok(service.findAll(page, size, search, metodo, estado));
        }
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('Admin','Vendedor','Analista')")
    public ResponseEntity<PaymentResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/by-venta/{ventaId}") @PreAuthorize("hasAnyRole('Admin','Vendedor','Analista')")
    public ResponseEntity<List<PaymentResponse>> findByVenta(@PathVariable String ventaId) {
        return ResponseEntity.ok(service.findByVenta(ventaId));
    }

    @PostMapping @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<PaymentResponse> create(@Valid @RequestBody PaymentCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createPayment(req));
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
