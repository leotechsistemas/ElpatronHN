package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ReminderRequest {
    private String clienteId;
    private String cliente;
    @NotBlank private String fecha;
    @NotBlank private String descripcion;
    private String prioridad;

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }
    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getPrioridad() { return prioridad; }
    public void setPrioridad(String prioridad) { this.prioridad = prioridad; }
}
