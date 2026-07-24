package com.patron.erp.dto.response;

import java.util.List;

public class PaymentResponse {
    private String id;
    private String clienteId;
    private String cliente;
    private String fecha;
    private Long montoTotal;
    private String metodo;
    private String estado;
    private String observaciones;
    private String registradoPor;
    private String createdAt;
    private int ventasCount;
    private List<PaymentItemResponse> items;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }
    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public Long getMontoTotal() { return montoTotal; }
    public void setMontoTotal(Long montoTotal) { this.montoTotal = montoTotal; }
    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getRegistradoPor() { return registradoPor; }
    public void setRegistradoPor(String registradoPor) { this.registradoPor = registradoPor; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public int getVentasCount() { return ventasCount; }
    public void setVentasCount(int ventasCount) { this.ventasCount = ventasCount; }
    public List<PaymentItemResponse> getItems() { return items; }
    public void setItems(List<PaymentItemResponse> items) { this.items = items; }
}
