package com.patron.erp.service;
import com.patron.erp.util.DateUtils;

import com.patron.erp.dto.request.StockLogRequest;
import com.patron.erp.dto.response.StockLogResponse;
import com.patron.erp.model.StockLog;
import com.patron.erp.repository.StockLogRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class StockLogService {

    private final StockLogRepository repository;

    public StockLogService(StockLogRepository repository) { this.repository = repository; }

    public List<StockLogResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public StockLogResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));
    }

    public StockLogResponse create(StockLogRequest req) {
        StockLog l = new StockLog();
        l.setId(generateId());
        l.setProductoId(req.getProductoId());
        l.setProducto(req.getProducto());
        l.setFecha(DateUtils.parseDate(req.getFecha()));
        l.setTipo(req.getTipo());
        l.setCantidad(req.getCantidad());
        l.setCostoUnitario(req.getCostoUnitario());
        l.setCostoTotal(req.getCostoTotal());
        l.setReferencia(req.getReferencia());
        l.setUsuario(req.getUsuario());
        return toResponse(repository.save(l));
    }

    private String generateId() { return "MOV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }

    private StockLogResponse toResponse(StockLog l) {
        StockLogResponse r = new StockLogResponse();
        r.setId(l.getId()); r.setProductoId(l.getProductoId()); r.setProducto(l.getProducto());
        r.setFecha(l.getFecha() != null ? l.getFecha().toString() : null);
        r.setTipo(l.getTipo()); r.setCantidad(l.getCantidad());
        r.setCostoUnitario(l.getCostoUnitario()); r.setCostoTotal(l.getCostoTotal());
        r.setReferencia(l.getReferencia()); r.setUsuario(l.getUsuario());
        return r;
    }
}


