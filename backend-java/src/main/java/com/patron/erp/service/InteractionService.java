package com.patron.erp.service;
import com.patron.erp.util.DateUtils;

import com.patron.erp.dto.request.InteractionRequest;
import com.patron.erp.dto.response.InteractionResponse;
import com.patron.erp.model.Interaction;
import com.patron.erp.repository.InteractionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class InteractionService {

    private final InteractionRepository repository;

    public InteractionService(InteractionRepository repository) { this.repository = repository; }

    public List<InteractionResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public InteractionResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Interacción no encontrada"));
    }

    public InteractionResponse create(InteractionRequest req) {
        Interaction i = new Interaction();
        i.setId(generateId());
        i.setClienteId(req.getClienteId());
        i.setCliente(req.getCliente());
        i.setFecha(DateUtils.parseDate(req.getFecha()));
        i.setTipo(req.getTipo());
        i.setResultado(req.getResultado());
        i.setObservaciones(req.getObservaciones());
        return toResponse(repository.save(i));
    }

    private String generateId() { return "INT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }

    private InteractionResponse toResponse(Interaction i) {
        InteractionResponse r = new InteractionResponse();
        r.setId(i.getId()); r.setClienteId(i.getClienteId()); r.setCliente(i.getCliente());
        r.setFecha(i.getFecha() != null ? i.getFecha().toString() : null);
        r.setTipo(i.getTipo()); r.setResultado(i.getResultado());
        r.setObservaciones(i.getObservaciones());
        return r;
    }
}


