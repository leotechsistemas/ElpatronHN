package com.patron.erp.dto.response;

public class ProductResponse {
    private String id;
    private String codigo;
    private String nombre;
    private String categoria;
    private Integer stockInicial;
    private Integer entradas;
    private Integer salidas;
    private Integer stockActual;
    private Long precioCosto;
    private Long precioVenta;
    private String observaciones;
    private String material;
    private String proveedorId;
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
