package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
public class ProductRequest {
    private String codigo;
    @NotBlank private String nombre;
    @NotBlank private String categoria;
    @PositiveOrZero private Integer stockInicial;
    @PositiveOrZero private Integer stockActual;
    @PositiveOrZero private Integer alertaStock;
    @Positive private Long precioCosto;
    @Positive private Long precioVenta;
    private String observaciones;
    private String material;
    private String proveedorId;

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public Integer getStockInicial() { return stockInicial; }
    public void setStockInicial(Integer stockInicial) { this.stockInicial = stockInicial; }
    public Integer getStockActual() { return stockActual; }
    public void setStockActual(Integer stockActual) { this.stockActual = stockActual; }
    public Integer getAlertaStock() { return alertaStock; }
    public void setAlertaStock(Integer alertaStock) { this.alertaStock = alertaStock; }
    public Long getPrecioCosto() { return precioCosto; }
    public void setPrecioCosto(Long precioCosto) { this.precioCosto = precioCosto; }
    public Long getPrecioVenta() { return precioVenta; }
    public void setPrecioVenta(Long precioVenta) { this.precioVenta = precioVenta; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }
    public String getProveedorId() { return proveedorId; }
    public void setProveedorId(String proveedorId) { this.proveedorId = proveedorId; }
}
