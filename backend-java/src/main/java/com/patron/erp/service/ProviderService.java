package com.patron.erp.service;

import com.patron.erp.dto.request.ProviderRequest;
import com.patron.erp.dto.response.ProviderResponse;
import com.patron.erp.model.Provider;
import com.patron.erp.repository.ProviderRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class ProviderService {
    private final ProviderRepository repository;

    public ProviderService(ProviderRepository repository) { this.repository = repository; }

    public List<ProviderResponse> findAll() { return repository.findAll().stream().map(this::toResponse).toList(); }

    public ProviderResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
    }

    public ProviderResponse create(ProviderRequest req) {
        Provider p = new Provider();
        p.setId("PRV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        p.setNombre(req.getNombre()); p.setContacto(req.getContacto());
        p.setTelefono(req.getTelefono()); p.setEmail(req.getEmail());
        p.setObservaciones(req.getObservaciones());
        return toResponse(repository.save(p));
    }

    public ProviderResponse update(String id, ProviderRequest req) {
        Provider p = repository.findById(id).orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        p.setNombre(req.getNombre()); p.setContacto(req.getContacto());
        p.setTelefono(req.getTelefono()); p.setEmail(req.getEmail());
        p.setObservaciones(req.getObservaciones());
        return toResponse(repository.save(p));
    }

    public void delete(String id) { repository.deleteById(id); }

    private ProviderResponse toResponse(Provider p) {
        ProviderResponse r = new ProviderResponse();
        r.setId(p.getId()); r.setNombre(p.getNombre()); r.setContacto(p.getContacto());
        r.setTelefono(p.getTelefono()); r.setEmail(p.getEmail()); r.setObservaciones(p.getObservaciones());
        return r;
    }
}
