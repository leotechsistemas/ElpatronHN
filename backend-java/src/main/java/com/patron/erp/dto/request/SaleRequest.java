package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class SaleRequest {
    @NotBlank private String fecha;
    @NotBlank private String clienteId;
    @NotBlank private String cliente;
    private String rtn;
    private Boolean conRtn = true;
    private String productoId;
    private String producto;
    @NotBlank private String tipoTrabajo;
    @Positive private Long precio;
    @NotBlank private String estado;
    private Long pagoInicial = 0L;
    @NotBlank private String estadoPago;
    private String observaciones;
    private String vendedorId;

    public String getFecha() { return fecha; } public void setFecha(String fecha) { this.fecha = fecha; }
    public String getClienteId() { return clienteId; } public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getCliente() { return cliente; } public void setCliente(String cliente) { this.cliente = cliente; }
    public String getRtn() { return rtn; } public void setRtn(String rtn) { this.rtn = rtn; }
    public Boolean getConRtn() { return conRtn; } public void setConRtn(Boolean conRtn) { this.conRtn = conRtn; }
    public String getProductoId() { return productoId; } public void setProductoId(String productoId) { this.productoId = productoId; }
    public String getProducto() { return producto; } public void setProducto(String producto) { this.producto = producto; }
    public String getTipoTrabajo() { return tipoTrabajo; } public void setTipoTrabajo(String tipoTrabajo) { this.tipoTrabajo = tipoTrabajo; }
    public Long getPrecio() { return precio; } public void setPrecio(Long precio) { this.precio = precio; }
    public String getEstado() { return estado; } public void setEstado(String estado) { this.estado = estado; }
    public Long getPagoInicial() { return pagoInicial; } public void setPagoInicial(Long pagoInicial) { this.pagoInicial = pagoInicial; }
    public String getEstadoPago() { return estadoPago; } public void setEstadoPago(String estadoPago) { this.estadoPago = estadoPago; }
    public String getObservaciones() { return observaciones; } public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getVendedorId() { return vendedorId; } public void setVendedorId(String vendedorId) { this.vendedorId = vendedorId; }
}
