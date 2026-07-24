package com.patron.erp.controller;

import com.patron.erp.dto.request.AccountCatalogRequest;
import com.patron.erp.dto.request.AccountingEntryRequest;
import com.patron.erp.dto.response.*;
import com.patron.erp.service.AccountingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounting")
public class AccountingController {

    private final AccountingService service;

    public AccountingController(AccountingService service) { this.service = service; }

    // ── Catálogo ──

    @GetMapping("/catalog")
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<List<AccountCatalogResponse>> getCatalog() {
        return ResponseEntity.ok(service.getCatalog());
    }

    @PostMapping("/catalog")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<AccountCatalogResponse> createAccount(@Valid @RequestBody AccountCatalogRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createAccount(req));
    }

    @PutMapping("/catalog/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<AccountCatalogResponse> updateAccount(@PathVariable String id, @Valid @RequestBody AccountCatalogRequest req) {
        return ResponseEntity.ok(service.updateAccount(id, req));
    }

    @PatchMapping("/catalog/{id}/toggle")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> toggleAccount(@PathVariable String id) {
        service.toggleAccount(id);
        return ResponseEntity.ok().build();
    }

    // ── Asientos ──

    @GetMapping("/entries")
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<?> getEntries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tipo) {
        if (page == 0 && size == 50 && search == null && tipo == null) {
            return ResponseEntity.ok(service.getEntries());
        }
        return ResponseEntity.ok(service.getEntries(page, size, search, tipo));
    }

    @GetMapping("/entries/{id}")
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<AccountingEntryResponse> getEntry(@PathVariable String id) {
        return ResponseEntity.ok(service.getEntry(id));
    }

    @PostMapping("/entries")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<AccountingEntryResponse> createEntry(@Valid @RequestBody AccountingEntryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createEntry(req));
    }

    @PostMapping("/entries/{id}/revert")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<AccountingEntryResponse> revertEntry(@PathVariable String id, @RequestParam String usuario) {
        return ResponseEntity.ok(service.revertEntry(id, usuario));
    }

    @DeleteMapping("/entries/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> deleteEntry(@PathVariable String id) {
        service.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }

    // ── Reportes ──

    @GetMapping("/ledger/{cuentaId}")
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<LedgerResponse> getLedger(
            @PathVariable String cuentaId,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta) {
        return ResponseEntity.ok(service.getLedger(cuentaId, desde, hasta));
    }

    @GetMapping("/balance")
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<BalanceResponse> getBalance(@RequestParam(required = false) String periodo) {
        return ResponseEntity.ok(periodo != null ? service.getBalance(periodo) : service.getBalance());
    }

    @GetMapping("/income-statement")
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<IncomeStatementResponse> getIncomeStatement(@RequestParam(required = false) String periodo) {
        return ResponseEntity.ok(periodo != null ? service.getIncomeStatement(periodo) : service.getIncomeStatement());
    }

    // ── Períodos Contables ──

    @GetMapping("/periodos")
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<List<PeriodoContableResponse>> getPeriodos() {
        return ResponseEntity.ok(service.getPeriodos());
    }

    @PostMapping("/close-period")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> closePeriod(@RequestParam String codigo, @RequestParam String usuario) {
        service.closePeriod(codigo, usuario);
        return ResponseEntity.ok().build();
    }
}
