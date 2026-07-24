package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ProductionTaskRequest {
    @NotBlank private String ventaId;
    @NotBlank private String clienteId;
    @NotBlank private String cliente;
    @NotBlank private String descripcion;
    @NotBlank private String tipo;
    private String estado = "Pendiente";
    private String creadoEn;
    private String inicioEn;
    private String completadoEn;
    private String vendedorId;
    private String prioridad = "Media";
    private String asignadoA;
    private String notasInternas;

    public String getVentaId() { return ventaId; } public void setVentaId(String ventaId) { this.ventaId = ventaId; }
    public String getClienteId() { return clienteId; } public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getCliente() { return cliente; } public void setCliente(String cliente) { this.cliente = cliente; }
    public String getDescripcion() { return descripcion; } public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getTipo() { return tipo; } public void setTipo(String tipo) { this.tipo = tipo; }
    public String getEstado() { return estado; } public void setEstado(String estado) { this.estado = estado; }
    public String getCreadoEn() { return creadoEn; } public void setCreadoEn(String creadoEn) { this.creadoEn = creadoEn; }
    public String getInicioEn() { return inicioEn; } public void setInicioEn(String inicioEn) { this.inicioEn = inicioEn; }
    public String getCompletadoEn() { return completadoEn; } public void setCompletadoEn(String completadoEn) { this.completadoEn = completadoEn; }
    public String getVendedorId() { return vendedorId; } public void setVendedorId(String vendedorId) { this.vendedorId = vendedorId; }
    public String getPrioridad() { return prioridad; } public void setPrioridad(String prioridad) { this.prioridad = prioridad; }
    public String getAsignadoA() { return asignadoA; } public void setAsignadoA(String asignadoA) { this.asignadoA = asignadoA; }
    public String getNotasInternas() { return notasInternas; } public void setNotasInternas(String notasInternas) { this.notasInternas = notasInternas; }
}
