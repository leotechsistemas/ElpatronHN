package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import java.util.List;

public class PaymentCreateRequest {

    @NotBlank private String clienteId;
    @NotBlank private String cliente;
    @NotBlank private String metodo;
    private String observaciones;
    private String registradoPor;
    @NotEmpty private List<ItemRequest> items;

    public static class ItemRequest {
        @NotBlank private String ventaId;
        @Positive private Long monto;
        public String getVentaId() { return ventaId; }
        public void setVentaId(String ventaId) { this.ventaId = ventaId; }
        public Long getMonto() { return monto; }
        public void setMonto(Long monto) { this.monto = monto; }
    }

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }
    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getRegistradoPor() { return registradoPor; }
    public void setRegistradoPor(String registradoPor) { this.registradoPor = registradoPor; }
    public List<ItemRequest> getItems() { return items; }
    public void setItems(List<ItemRequest> items) { this.items = items; }
}
