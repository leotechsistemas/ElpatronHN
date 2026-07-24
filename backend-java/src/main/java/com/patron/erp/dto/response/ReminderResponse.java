package com.patron.erp.dto.response;

public class ReminderResponse {
    private String id;
    private String clienteId;
    private String cliente;
    private String fecha;
    private String descripcion;
    private String prioridad;
    private String completado;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
    public String getCompletado() { return completado; }
    public void setCompletado(String completado) { this.completado = completado; }
}
