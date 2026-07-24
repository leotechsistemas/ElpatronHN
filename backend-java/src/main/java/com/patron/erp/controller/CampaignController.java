package com.patron.erp.controller;

import com.patron.erp.dto.request.CampaignRequest;
import com.patron.erp.dto.response.CampaignResponse;
import com.patron.erp.model.User;
import com.patron.erp.service.CampaignService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {

    private final CampaignService service;

    public CampaignController(CampaignService service) {
        this.service = service;
    }

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('Admin','Vendedor')")
    public ResponseEntity<CampaignResponse> send(@Valid @RequestBody CampaignRequest req,
                                                  @AuthenticationPrincipal User user) {
        String userId = user != null ? user.getId() : "";
        return ResponseEntity.status(HttpStatus.CREATED).body(service.send(req, userId));
    }
}
