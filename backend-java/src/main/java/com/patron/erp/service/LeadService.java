package com.patron.erp.service;

import com.patron.erp.dto.response.LeadResponse;
import com.patron.erp.model.Lead;
import com.patron.erp.repository.LeadRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeadService {
    private final LeadRepository repository;

    public LeadService(LeadRepository repository) {
        this.repository = repository;
    }

    public List<LeadResponse> findAll() {
        return repository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public LeadResponse findById(Long id) {
        return repository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Lead no encontrado"));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Lead no encontrado");
        }
        repository.deleteById(id);
    }

    private LeadResponse toResponse(Lead l) {
        LeadResponse r = new LeadResponse();
        r.setId(l.getId());
        r.setNombre(l.getNombre());
        r.setCorreo(l.getCorreo());
        r.setTelefono(l.getTelefono());
        r.setEmpresa(l.getEmpresa());
        r.setCategoria(l.getCategoria());
        r.setDescripcion(l.getDescripcion());
        r.setDetalles(l.getDetalles());
        r.setIpAddress(l.getIpAddress());
        r.setUserAgent(l.getUserAgent());
        r.setReferer(l.getReferer());
        r.setPageUrl(l.getPageUrl());
        r.setCreatedAt(l.getCreatedAt() != null ? l.getCreatedAt().toString() : null);
        return r;
    }
}
