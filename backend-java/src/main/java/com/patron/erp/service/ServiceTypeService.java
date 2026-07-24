package com.patron.erp.service;

import com.patron.erp.dto.request.ServiceTypeRequest;
import com.patron.erp.dto.response.ServiceTypeResponse;
import com.patron.erp.model.ServiceType;
import com.patron.erp.repository.ServiceTypeRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class ServiceTypeService {

    private final ServiceTypeRepository repository;

    public ServiceTypeService(ServiceTypeRepository repository) { this.repository = repository; }

    public List<ServiceTypeResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public List<ServiceTypeResponse> findActivos() {
        return repository.findByActivoTrueOrderByNombre().stream().map(this::toResponse).toList();
    }

    public ServiceTypeResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Tipo de servicio no encontrado"));
    }

    public ServiceTypeResponse create(ServiceTypeRequest req) {
        ServiceType st = new ServiceType();
        st.setId(generateId());
        applyRequest(st, req);
        if (st.getActivo() == null) st.setActivo(true);
        if (st.getIcono() == null || st.getIcono().isBlank()) st.setIcono("🔧");
        return toResponse(repository.save(st));
    }

    public ServiceTypeResponse update(String id, ServiceTypeRequest req) {
        ServiceType st = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de servicio no encontrado"));
        applyRequest(st, req);
        return toResponse(repository.save(st));
    }

    public void delete(String id) {
        if (!repository.existsById(id)) throw new RuntimeException("Tipo de servicio no encontrado");
        repository.deleteById(id);
    }

    public ServiceTypeResponse toggleActivo(String id) {
        ServiceType st = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de servicio no encontrado"));
        st.setActivo(!Boolean.TRUE.equals(st.getActivo()));
        return toResponse(repository.save(st));
    }

    private void applyRequest(ServiceType st, ServiceTypeRequest req) {
        st.setNombre(req.getNombre());
        st.setDescripcion(req.getDescripcion());
        st.setPrecioSugerido(req.getPrecioSugerido());
        if (req.getIcono() != null && !req.getIcono().isBlank()) st.setIcono(req.getIcono());
        if (req.getActivo() != null) st.setActivo(req.getActivo());
    }

    private String generateId() { return "ST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }

    private ServiceTypeResponse toResponse(ServiceType st) {
        ServiceTypeResponse r = new ServiceTypeResponse();
        r.setId(st.getId()); r.setNombre(st.getNombre()); r.setDescripcion(st.getDescripcion());
        r.setPrecioSugerido(st.getPrecioSugerido()); r.setIcono(st.getIcono()); r.setActivo(st.getActivo());
        return r;
    }
}
