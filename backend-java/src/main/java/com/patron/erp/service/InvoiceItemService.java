package com.patron.erp.service;

import com.patron.erp.dto.request.InvoiceItemRequest;
import com.patron.erp.dto.response.InvoiceItemResponse;
import com.patron.erp.model.InvoiceItem;
import com.patron.erp.repository.InvoiceItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class InvoiceItemService {

    private final InvoiceItemRepository repository;

    public InvoiceItemService(InvoiceItemRepository repository) { this.repository = repository; }

    public List<InvoiceItemResponse> findByVentaId(String ventaId) {
        return repository.findByVentaIdOrderByTipoItem(ventaId).stream().map(this::toResponse).toList();
    }

    public InvoiceItemResponse create(InvoiceItemRequest req) {
        InvoiceItem item = new InvoiceItem();
        item.setId(generateId());
        item.setVentaId(req.getVentaId());
        item.setTipoItem(req.getTipoItem());
        item.setProductoId(req.getProductoId());
        item.setServicioId(req.getServicioId());
        item.setDescripcion(req.getDescripcion());
        item.setCantidad(req.getCantidad() != null ? req.getCantidad() : 1L);
        item.setPrecioUnitario(req.getPrecioUnitario());
        item.setDescuento(req.getDescuento() != null ? req.getDescuento() : 0L);
        item.setIsv(req.getIsv() != null ? req.getIsv() : 15);
        calculateTotals(item);
        return toResponse(repository.save(item));
    }

    public InvoiceItemResponse update(String id, InvoiceItemRequest req) {
        InvoiceItem item = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item no encontrado"));
        item.setTipoItem(req.getTipoItem());
        item.setProductoId(req.getProductoId());
        item.setServicioId(req.getServicioId());
        item.setDescripcion(req.getDescripcion());
        item.setCantidad(req.getCantidad() != null ? req.getCantidad() : 1L);
        item.setPrecioUnitario(req.getPrecioUnitario());
        item.setDescuento(req.getDescuento() != null ? req.getDescuento() : 0L);
        item.setIsv(req.getIsv() != null ? req.getIsv() : 15);
        calculateTotals(item);
        return toResponse(repository.save(item));
    }

    public void delete(String id) {
        if (!repository.existsById(id)) throw new RuntimeException("Item no encontrado");
        repository.deleteById(id);
    }

    public void deleteByVentaId(String ventaId) {
        repository.deleteByVentaId(ventaId);
    }

    private void calculateTotals(InvoiceItem item) {
        long cantidad = item.getCantidad();
        long precio = item.getPrecioUnitario();
        long descuento = item.getDescuento();
        int isv = item.getIsv();

        long subtotal = cantidad * precio - descuento;
        if (subtotal < 0) subtotal = 0L;
        item.setSubtotal(subtotal);

        long impuesto = subtotal * isv / 100;
        long totalLinea = subtotal + impuesto;
        item.setTotalLinea(totalLinea);
    }

    private String generateId() { return "INV-ITM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }

    private InvoiceItemResponse toResponse(InvoiceItem item) {
        InvoiceItemResponse r = new InvoiceItemResponse();
        r.setId(item.getId()); r.setVentaId(item.getVentaId());
        r.setTipoItem(item.getTipoItem()); r.setProductoId(item.getProductoId());
        r.setServicioId(item.getServicioId()); r.setDescripcion(item.getDescripcion());
        r.setCantidad(item.getCantidad()); r.setPrecioUnitario(item.getPrecioUnitario());
        r.setDescuento(item.getDescuento()); r.setIsv(item.getIsv());
        r.setSubtotal(item.getSubtotal()); r.setTotalLinea(item.getTotalLinea());
        return r;
    }
}
