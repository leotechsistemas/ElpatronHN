package com.patron.erp.service;

import com.patron.erp.dto.request.ProductionTaskRequest;
import com.patron.erp.dto.response.ProductionTaskResponse;
import com.patron.erp.model.ProductionTask;
import com.patron.erp.repository.ProductionTaskRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductionTaskService {
    private final ProductionTaskRepository repository;

    public ProductionTaskService(ProductionTaskRepository repository) { this.repository = repository; }

    public List<ProductionTaskResponse> findAll() { return repository.findAll().stream().map(this::toResponse).toList(); }

    public ProductionTaskResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
    }

    public List<ProductionTaskResponse> findByVenta(String ventaId) {
        return repository.findByVentaId(ventaId).stream().map(this::toResponse).toList();
    }

    public ProductionTaskResponse create(ProductionTaskRequest req) {
        ProductionTask t = new ProductionTask();
        t.setId(UUID.randomUUID().toString().substring(0, 8));
        t.setVentaId(req.getVentaId()); t.setClienteId(req.getClienteId()); t.setCliente(req.getCliente());
        t.setDescripcion(req.getDescripcion()); t.setTipo(req.getTipo());
        t.setEstado("Pendiente");
        t.setCreadoEn(LocalDateTime.now());
        t.setVendedorId(req.getVendedorId());
        t.setPrioridad(req.getPrioridad() != null ? req.getPrioridad() : "Media");
        t.setAsignadoA(req.getAsignadoA());
        t.setNotasInternas(req.getNotasInternas());
        return toResponse(repository.save(t));
    }

    public ProductionTaskResponse updateEstado(String id, String estado) {
        ProductionTask t = repository.findById(id).orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
        t.setEstado(estado);
        if ("En Proceso".equals(estado) && t.getInicioEn() == null) t.setInicioEn(LocalDateTime.now());
        if ("Completada".equals(estado)) t.setCompletadoEn(LocalDateTime.now());
        return toResponse(repository.save(t));
    }

    public ProductionTaskResponse update(String id, ProductionTaskRequest req) {
        ProductionTask t = repository.findById(id).orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
        if (req.getDescripcion() != null) t.setDescripcion(req.getDescripcion());
        if (req.getTipo() != null) t.setTipo(req.getTipo());
        if (req.getPrioridad() != null) t.setPrioridad(req.getPrioridad());
        if (req.getAsignadoA() != null) t.setAsignadoA(req.getAsignadoA());
        if (req.getNotasInternas() != null) t.setNotasInternas(req.getNotasInternas());
        return toResponse(repository.save(t));
    }

    public Map<String, Object> getEstadisticas() {
        List<ProductionTask> tasks = repository.findAll();
        long total = tasks.size();
        long pendientes = tasks.stream().filter(t -> "Pendiente".equals(t.getEstado())).count();
        long enProceso = tasks.stream().filter(t -> "En Proceso".equals(t.getEstado())).count();
        long completadas = tasks.stream().filter(t -> "Completada".equals(t.getEstado())).count();

        Map<String, Long> countByTipo = tasks.stream()
                .filter(t -> "Completada".equals(t.getEstado()))
                .collect(Collectors.groupingBy(ProductionTask::getTipo, Collectors.counting()));

        List<ProductionTask> completadasList = tasks.stream()
                .filter(t -> "Completada".equals(t.getEstado()) && t.getInicioEn() != null && t.getCompletadoEn() != null)
                .toList();
        double tiempoPromedioMinutos = completadasList.stream()
                .mapToLong(t -> ChronoUnit.MINUTES.between(t.getInicioEn(), t.getCompletadoEn()))
                .average().orElse(0);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", total);
        stats.put("pendientes", pendientes);
        stats.put("en_proceso", enProceso);
        stats.put("completadas", completadas);
        stats.put("count_by_tipo", countByTipo);
        stats.put("tiempo_promedio_minutos", Math.round(tiempoPromedioMinutos));
        return stats;
    }

    private ProductionTaskResponse toResponse(ProductionTask t) {
        ProductionTaskResponse r = new ProductionTaskResponse();
        r.setId(t.getId()); r.setVentaId(t.getVentaId()); r.setClienteId(t.getClienteId());
        r.setCliente(t.getCliente()); r.setDescripcion(t.getDescripcion()); r.setTipo(t.getTipo());
        r.setEstado(t.getEstado());
        r.setCreadoEn(t.getCreadoEn() != null ? t.getCreadoEn().toString() : null);
        r.setInicioEn(t.getInicioEn() != null ? t.getInicioEn().toString() : null);
        r.setCompletadoEn(t.getCompletadoEn() != null ? t.getCompletadoEn().toString() : null);
        r.setVendedorId(t.getVendedorId());
        r.setPrioridad(t.getPrioridad());
        r.setAsignadoA(t.getAsignadoA());
        r.setNotasInternas(t.getNotasInternas());
        return r;
    }
}
