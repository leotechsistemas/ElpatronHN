package com.patron.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    private String id;

    private String codigo;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String categoria;

    @Column(nullable = false)
    private Integer stockInicial;

    @Column(nullable = false)
    private Integer entradas = 0;

    @Column(nullable = false)
    private Integer salidas = 0;

    @Column(nullable = false)
    private Integer stockActual = 0;

    @Column(name = "precio_costo", nullable = false)
    private Long precioCosto;

    @Column(name = "precio_venta", nullable = false)
    private Long precioVenta;

    private String observaciones;
    private String material;

    @Column(name = "proveedor_id")
    private String proveedorId;

    @Column(name = "alerta_stock", nullable = false)
    private Integer alertaStock;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Integer getStockInicial() { return stockInicial; }
    public void setStockInicial(Integer stockInicial) { this.stockInicial = stockInicial; }

    public Integer getEntradas() { return entradas; }
    public void setEntradas(Integer entradas) { this.entradas = entradas; }

    public Integer getSalidas() { return salidas; }
    public void setSalidas(Integer salidas) { this.salidas = salidas; }

    public Integer getStockActual() { return stockActual; }
    public void setStockActual(Integer stockActual) { this.stockActual = stockActual; }

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

    public Integer getAlertaStock() { return alertaStock; }
    public void setAlertaStock(Integer alertaStock) { this.alertaStock = alertaStock; }
}
