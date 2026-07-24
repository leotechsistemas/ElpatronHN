package com.patron.erp.dto.response;

public class InvoiceItemResponse {
    private String id; private String ventaId; private String tipoItem;
    private String productoId; private String servicioId; private String descripcion;
    private Long cantidad; private Long precioUnitario;
    private Long descuento; private Integer isv;
    private Long subtotal; private Long totalLinea;

    public String getId() { return id; } public void setId(String id) { this.id = id; }
    public String getVentaId() { return ventaId; } public void setVentaId(String ventaId) { this.ventaId = ventaId; }
    public String getTipoItem() { return tipoItem; } public void setTipoItem(String tipoItem) { this.tipoItem = tipoItem; }
    public String getProductoId() { return productoId; } public void setProductoId(String productoId) { this.productoId = productoId; }
    public String getServicioId() { return servicioId; } public void setServicioId(String servicioId) { this.servicioId = servicioId; }
    public String getDescripcion() { return descripcion; } public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public Long getCantidad() { return cantidad; } public void setCantidad(Long cantidad) { this.cantidad = cantidad; }
    public Long getPrecioUnitario() { return precioUnitario; } public void setPrecioUnitario(Long precioUnitario) { this.precioUnitario = precioUnitario; }
    public Long getDescuento() { return descuento; } public void setDescuento(Long descuento) { this.descuento = descuento; }
    public Integer getIsv() { return isv; } public void setIsv(Integer isv) { this.isv = isv; }
    public Long getSubtotal() { return subtotal; } public void setSubtotal(Long subtotal) { this.subtotal = subtotal; }
    public Long getTotalLinea() { return totalLinea; } public void setTotalLinea(Long totalLinea) { this.totalLinea = totalLinea; }
}
