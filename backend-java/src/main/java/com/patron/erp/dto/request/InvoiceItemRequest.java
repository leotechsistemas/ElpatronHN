package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class InvoiceItemRequest {
    @NotBlank private String ventaId;
    @NotBlank private String tipoItem;
    private String productoId;
    private String servicioId;
    @NotBlank private String descripcion;
    @Positive private Long cantidad = 1L;
    @Positive private Long precioUnitario;
    private Long descuento = 0L;
    private Integer isv = 15;

    public String getVentaId() { return ventaId; } public void setVentaId(String ventaId) { this.ventaId = ventaId; }
    public String getTipoItem() { return tipoItem; } public void setTipoItem(String tipoItem) { this.tipoItem = tipoItem; }
    public String getProductoId() { return productoId; } public void setProductoId(String productoId) { this.productoId = productoId; }
    public String getServicioId() { return servicioId; } public void setServicioId(String servicioId) { this.servicioId = servicioId; }
    public String getDescripcion() { return descripcion; } public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public Long getCantidad() { return cantidad; } public void setCantidad(Long cantidad) { this.cantidad = cantidad; }
    public Long getPrecioUnitario() { return precioUnitario; } public void setPrecioUnitario(Long precioUnitario) { this.precioUnitario = precioUnitario; }
    public Long getDescuento() { return descuento; } public void setDescuento(Long descuento) { this.descuento = descuento; }
    public Integer getIsv() { return isv; } public void setIsv(Integer isv) { this.isv = isv; }
}
