package com.patron.erp.service;

import com.patron.erp.model.AuditLog;
import com.patron.erp.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    public void log(String usuario, String accion, String entidad, String entidadId, String detalle, String ip) {
        repository.save(new AuditLog(usuario, accion, entidad, entidadId, detalle, ip));
    }
}
