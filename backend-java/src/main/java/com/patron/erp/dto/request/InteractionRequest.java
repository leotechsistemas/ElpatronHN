package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;

public class InteractionRequest {
    @NotBlank private String clienteId;
    @NotBlank private String cliente;
    @NotBlank private String fecha;
    @NotBlank private String tipo;
    @NotBlank private String resultado;
    private String observaciones;

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }
    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
