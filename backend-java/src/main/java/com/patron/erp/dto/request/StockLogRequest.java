package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
public class StockLogRequest {
    @NotBlank private String productoId;
    @NotBlank private String producto;
    @NotBlank private String fecha;
    @NotBlank private String tipo;
    @PositiveOrZero private Integer cantidad;
    private Long costoUnitario;
    private Long costoTotal;
    private String referencia;
    private String usuario;

    public String getProductoId() { return productoId; }
    public void setProductoId(String productoId) { this.productoId = productoId; }
    public String getProducto() { return producto; }
    public void setProducto(String producto) { this.producto = producto; }
    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public Long getCostoUnitario() { return costoUnitario; }
    public void setCostoUnitario(Long costoUnitario) { this.costoUnitario = costoUnitario; }
    public Long getCostoTotal() { return costoTotal; }
    public void setCostoTotal(Long costoTotal) { this.costoTotal = costoTotal; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
}
