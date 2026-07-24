package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "stock_logs")
public class StockLog {

    @Id
    private String id;

    @Column(name = "producto_id", nullable = false)
    private String productoId;

    @Column(nullable = false)
    private String producto;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "costo_unitario")
    private Long costoUnitario;

    @Column(name = "costo_total")
    private Long costoTotal;

    private String referencia;
    private String usuario;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProductoId() { return productoId; }
    public void setProductoId(String productoId) { this.productoId = productoId; }

    public String getProducto() { return producto; }
    public void setProducto(String producto) { this.producto = producto; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

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
