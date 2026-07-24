package com.patron.erp.dto.response;

public class QuotationResponse {
    private String id; private String fecha; private String fechaExpiracion; private String clienteId; private String cliente;
    private String rtn; private Boolean conRtn;
    private String items; private Long precioTotal; private Long descuento;
    private Integer isv; private String estado; private String observaciones; private String vendedorId;

    public String getId() { return id; } public void setId(String id) { this.id = id; }
    public String getFecha() { return fecha; } public void setFecha(String fecha) { this.fecha = fecha; }
    public String getFechaExpiracion() { return fechaExpiracion; } public void setFechaExpiracion(String fechaExpiracion) { this.fechaExpiracion = fechaExpiracion; }
    public String getClienteId() { return clienteId; } public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getCliente() { return cliente; } public void setCliente(String cliente) { this.cliente = cliente; }
    public String getRtn() { return rtn; } public void setRtn(String rtn) { this.rtn = rtn; }
    public Boolean getConRtn() { return conRtn; } public void setConRtn(Boolean conRtn) { this.conRtn = conRtn; }
    public String getItems() { return items; } public void setItems(String items) { this.items = items; }
    public Long getPrecioTotal() { return precioTotal; } public void setPrecioTotal(Long precioTotal) { this.precioTotal = precioTotal; }
    public Long getDescuento() { return descuento; } public void setDescuento(Long descuento) { this.descuento = descuento; }
    public Integer getIsv() { return isv; } public void setIsv(Integer isv) { this.isv = isv; }
    public String getEstado() { return estado; } public void setEstado(String estado) { this.estado = estado; }
    public String getObservaciones() { return observaciones; } public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getVendedorId() { return vendedorId; } public void setVendedorId(String vendedorId) { this.vendedorId = vendedorId; }
}
