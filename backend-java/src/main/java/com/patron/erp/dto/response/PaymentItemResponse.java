package com.patron.erp.dto.response;

public class PaymentItemResponse {
    private Long id;
    private String ventaId;
    private Long montoAsignado;
    private String producto;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getVentaId() { return ventaId; }
    public void setVentaId(String ventaId) { this.ventaId = ventaId; }
    public Long getMontoAsignado() { return montoAsignado; }
    public void setMontoAsignado(Long montoAsignado) { this.montoAsignado = montoAsignado; }
    public String getProducto() { return producto; }
    public void setProducto(String producto) { this.producto = producto; }
}
