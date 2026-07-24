package com.patron.erp.service;
import com.patron.erp.util.DateUtils;

import com.patron.erp.dto.request.ReminderRequest;
import com.patron.erp.dto.response.ReminderResponse;
import com.patron.erp.model.Reminder;
import com.patron.erp.repository.ReminderRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ReminderService {

    private final ReminderRepository repository;

    public ReminderService(ReminderRepository repository) { this.repository = repository; }

    public List<ReminderResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public ReminderResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Recordatorio no encontrado"));
    }

    public ReminderResponse create(ReminderRequest req) {
        Reminder r = new Reminder();
        r.setId(generateId());
        r.setClienteId(req.getClienteId());
        r.setCliente(req.getCliente());
        r.setFecha(DateUtils.parseDate(req.getFecha()));
        r.setDescripcion(req.getDescripcion());
        r.setPrioridad(req.getPrioridad());
        r.setCompletado(false);
        return toResponse(repository.save(r));
    }

    public ReminderResponse complete(String id) {
        Reminder r = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recordatorio no encontrado"));
        r.setCompletado(true);
        return toResponse(repository.save(r));
    }

    private String generateId() { return "REM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }

    private ReminderResponse toResponse(Reminder r) {
        ReminderResponse res = new ReminderResponse();
        res.setId(r.getId()); res.setClienteId(r.getClienteId()); res.setCliente(r.getCliente());
        res.setFecha(r.getFecha() != null ? r.getFecha().toString() : null);
        res.setDescripcion(r.getDescripcion());
        res.setPrioridad(r.getPrioridad());
        res.setCompletado(r.getCompletado() != null && r.getCompletado() ? "TRUE" : "FALSE");
        return res;
    }
}


