package com.patron.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "invoice_items")
public class InvoiceItem {

    @Id
    private String id;

    @Column(name = "venta_id", nullable = false)
    private String ventaId;

    @Column(name = "tipo_item", nullable = false, length = 10)
    private String tipoItem;

    @Column(name = "producto_id")
    private String productoId;

    @Column(name = "servicio_id")
    private String servicioId;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private Long cantidad = 1L;

    @Column(name = "precio_unitario", nullable = false)
    private Long precioUnitario;

    @Column(nullable = false)
    private Long descuento = 0L;

    @Column(nullable = false)
    private Integer isv = 15;

    @Column(nullable = false)
    private Long subtotal;

    @Column(name = "total_linea", nullable = false)
    private Long totalLinea;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVentaId() { return ventaId; }
    public void setVentaId(String ventaId) { this.ventaId = ventaId; }
    public String getTipoItem() { return tipoItem; }
    public void setTipoItem(String tipoItem) { this.tipoItem = tipoItem; }
    public String getProductoId() { return productoId; }
    public void setProductoId(String productoId) { this.productoId = productoId; }
    public String getServicioId() { return servicioId; }
    public void setServicioId(String servicioId) { this.servicioId = servicioId; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public Long getCantidad() { return cantidad; }
    public void setCantidad(Long cantidad) { this.cantidad = cantidad; }
    public Long getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(Long precioUnitario) { this.precioUnitario = precioUnitario; }
    public Long getDescuento() { return descuento; }
    public void setDescuento(Long descuento) { this.descuento = descuento; }
    public Integer getIsv() { return isv; }
    public void setIsv(Integer isv) { this.isv = isv; }
    public Long getSubtotal() { return subtotal; }
    public void setSubtotal(Long subtotal) { this.subtotal = subtotal; }
    public Long getTotalLinea() { return totalLinea; }
    public void setTotalLinea(Long totalLinea) { this.totalLinea = totalLinea; }
}
