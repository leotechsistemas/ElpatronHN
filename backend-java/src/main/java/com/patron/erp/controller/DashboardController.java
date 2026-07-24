package com.patron.erp.controller;

import com.patron.erp.dto.response.DashboardResponse;
import com.patron.erp.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService service;
    public DashboardController(DashboardService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('Admin','Analista')")
    public ResponseEntity<DashboardResponse> getDashboard(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(service.getDashboard(period));
    }
}
