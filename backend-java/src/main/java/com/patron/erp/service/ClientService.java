package com.patron.erp.service;
import com.patron.erp.util.DateUtils;

import com.patron.erp.dto.request.ClientRequest;
import com.patron.erp.dto.response.ClientResponse;
import com.patron.erp.dto.response.PageResponse;
import com.patron.erp.model.Client;
import com.patron.erp.repository.ClientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;

@Service
public class ClientService {

    private final ClientRepository repository;

    public ClientService(ClientRepository repository) { this.repository = repository; }

    @Transactional
    public void updateLtv(String clientId, Long monto) {
        repository.findById(clientId).ifPresent(c -> {
            c.setLtv(c.getLtv() != null ? c.getLtv() + monto : monto);
            repository.save(c);
        });
    }

    public List<ClientResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public PageResponse<ClientResponse> findAll(int page, int size, String search, String clasificacion) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "nombre"));
        Specification<Client> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank())
                predicates.add(cb.like(cb.lower(root.get("nombre")), "%" + search.toLowerCase() + "%"));
            if (clasificacion != null && !clasificacion.isBlank() && !clasificacion.equals("todas"))
                predicates.add(cb.equal(root.get("clasificacion"), clasificacion));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Client> clientPage = repository.findAll(spec, pageable);
        return new PageResponse<>(
            clientPage.getContent().stream().map(this::toResponse).toList(),
            clientPage.getTotalElements(), clientPage.getTotalPages(), clientPage.getNumber(), clientPage.getSize()
        );
    }

    public ClientResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    }

    public ClientResponse create(ClientRequest req) {
        Client c = new Client();
        c.setId(generateId());
        if (req.getFechaRegistro() == null || req.getFechaRegistro().isBlank()) {
            req.setFechaRegistro(java.time.LocalDate.now().toString());
        }
        applyRequest(c, req);
        return toResponse(repository.save(c));
    }

    public ClientResponse update(String id, ClientRequest req) {
        Client c = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        applyRequest(c, req);
        return toResponse(repository.save(c));
    }

    public void delete(String id) {
        if (!repository.existsById(id)) throw new RuntimeException("Cliente no encontrado");
        repository.deleteById(id);
    }

    private void applyRequest(Client c, ClientRequest req) {
        c.setNombre(req.getNombre()); c.setRtn(req.getRtn()); c.setTelefono(req.getTelefono()); c.setEmail(req.getEmail());
        c.setEstado(req.getEstado()); c.setObservaciones(req.getObservaciones());
        c.setClasificacion(req.getClasificacion());
        if (req.getFechaRegistro() != null && !req.getFechaRegistro().isBlank()) {
            c.setFechaRegistro(DateUtils.parseDate(req.getFechaRegistro()));
        }
        c.setLtv(req.getLtv() != null ? req.getLtv() : 0L);
        c.setRfmScore(req.getRfmScore() != null ? req.getRfmScore() : 5);
        c.setDepartamento(req.getDepartamento()); c.setCiudad(req.getCiudad());
    }

    private String generateId() { return "CLI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }

    private ClientResponse toResponse(Client c) {
        ClientResponse r = new ClientResponse();
        r.setId(c.getId()); r.setNombre(c.getNombre()); r.setRtn(c.getRtn()); r.setTelefono(c.getTelefono());
        r.setEmail(c.getEmail()); r.setEstado(c.getEstado()); r.setObservaciones(c.getObservaciones());
        r.setClasificacion(c.getClasificacion()); r.setFechaRegistro(c.getFechaRegistro() != null ? c.getFechaRegistro().toString() : null);
        r.setLtv(c.getLtv()); r.setRfmScore(c.getRfmScore());
        r.setDepartamento(c.getDepartamento()); r.setCiudad(c.getCiudad());
        return r;
    }
}
