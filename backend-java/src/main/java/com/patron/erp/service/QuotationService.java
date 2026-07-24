package com.patron.erp.service;
import com.patron.erp.util.DateUtils;

import com.patron.erp.dto.request.QuotationRequest;
import com.patron.erp.dto.response.QuotationResponse;
import com.patron.erp.model.Quotation;
import com.patron.erp.repository.QuotationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class QuotationService {
    private static final Logger log = LoggerFactory.getLogger(QuotationService.class);
    private final QuotationRepository repository;
    private final EntityManager entityManager;
    private final TransactionTemplate transactionTemplate;
    public QuotationService(QuotationRepository repository, EntityManager entityManager, TransactionTemplate transactionTemplate) { this.repository = repository; this.entityManager = entityManager; this.transactionTemplate = transactionTemplate; }

    @jakarta.annotation.PostConstruct
    public void migrateNullExpirationDates() {
        transactionTemplate.executeWithoutResult(status -> {
            List<Quotation> nullExpirations = repository.findByFechaExpiracionIsNull();
            if (!nullExpirations.isEmpty()) {
                int count = 0;
                for (Quotation q : nullExpirations) {
                    if (q.getFecha() != null) {
                        q.setFechaExpiracion(q.getFecha().plusDays(15));
                        repository.save(q);
                        count++;
                    }
                }
                if (count > 0) {
                    log.info("Actualizadas {} cotizaciones con fecha_expiracion pendiente en Java", count);
                }
            }
        });
    }

    public Page<QuotationResponse> findAll(String estado, int page, int size) {
        if (estado == null || estado.isBlank()) estado = "pendiente";
        String dbEstado = estado.substring(0, 1).toUpperCase() + estado.substring(1).toLowerCase();
        Pageable pageable = PageRequest.of(page, size, Sort.by("fecha").descending());
        return repository.findByEstadoOrderByFechaDesc(dbEstado, pageable).map(this::toResponse);
    }

    public QuotationResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Cotización no encontrada"));
    }

    public QuotationResponse create(QuotationRequest req) {
        Quotation q = new Quotation();
        q.setId("COT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        LocalDate fecha = DateUtils.parseDate(req.getFecha());
        q.setFecha(fecha);
        if (req.getFechaExpiracion() != null && !req.getFechaExpiracion().isBlank()) {
            q.setFechaExpiracion(DateUtils.parseDate(req.getFechaExpiracion()));
        } else {
            q.setFechaExpiracion(fecha.plusDays(15));
        }
        q.setClienteId(req.getClienteId()); q.setCliente(req.getCliente());
        q.setRtn(req.getRtn()); q.setConRtn(req.getConRtn() != null ? req.getConRtn() : true);
        q.setItems(req.getItems()); q.setPrecioTotal(req.getPrecioTotal());
        q.setDescuento(req.getDescuento() != null ? req.getDescuento() : 0L);
        q.setIsv(req.getIsv() != null ? req.getIsv() : 15);
        q.setEstado(req.getEstado()); q.setObservaciones(req.getObservaciones()); q.setVendedorId(req.getVendedorId());
        return toResponse(repository.save(q));
    }

    public QuotationResponse update(String id, QuotationRequest req) {
        Quotation q = repository.findById(id).orElseThrow(() -> new RuntimeException("Cotización no encontrada"));
        q.setEstado(req.getEstado()); q.setObservaciones(req.getObservaciones());
        return toResponse(repository.save(q));
    }

    public QuotationResponse patch(String id, Map<String, Object> updates) {
        Quotation q = repository.findById(id).orElseThrow(() -> new RuntimeException("Cotización no encontrada"));
        if (updates.containsKey("estado")) q.setEstado((String) updates.get("estado"));
        if (updates.containsKey("observaciones")) q.setObservaciones((String) updates.get("observaciones"));
        return toResponse(repository.save(q));
    }

    public void delete(String id) { repository.deleteById(id); }

    @Scheduled(cron = "0 0 0 * * *")
    public void autoExpireQuotations() {
        List<Quotation> expired = repository.findExpiredPendientes(LocalDate.now());
        if (expired.isEmpty()) return;
        log.info("Venciendo {} cotizaciones expiradas", expired.size());
        for (Quotation q : expired) {
            q.setEstado("Vencida");
            repository.save(q);
        }
    }

    private QuotationResponse toResponse(Quotation q) {
        QuotationResponse r = new QuotationResponse();
        r.setId(q.getId());         r.setFecha(q.getFecha() != null ? q.getFecha().toString() : null);
        r.setFechaExpiracion(q.getFechaExpiracion() != null ? q.getFechaExpiracion().toString() : null);
        r.setClienteId(q.getClienteId());
        r.setCliente(q.getCliente()); r.setRtn(q.getRtn()); r.setConRtn(q.getConRtn());
        r.setItems(q.getItems()); r.setPrecioTotal(q.getPrecioTotal());
        r.setDescuento(q.getDescuento()); r.setIsv(q.getIsv()); r.setEstado(q.getEstado());
        r.setObservaciones(q.getObservaciones()); r.setVendedorId(q.getVendedorId());
        return r;
    }
}
