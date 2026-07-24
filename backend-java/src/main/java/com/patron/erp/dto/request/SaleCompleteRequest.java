package com.patron.erp.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.List;

public class SaleCompleteRequest {

    @NotBlank private String clienteId;
    @NotBlank private String cliente;
    private String rtn;
    private Boolean conRtn = true;
    private String observaciones;
    private String vendedorId;

    @Valid
    private List<InvoiceItemData> items;

    private InitialPaymentData pagoInicial;

    public static class InvoiceItemData {
        @NotBlank private String tipoItem;
        private String productoId;
        private String servicioId;
        @NotBlank private String descripcion;
        @Positive private Long cantidad = 1L;
        @Positive private Long precioUnitario;
        private Long descuento = 0L;
        private Integer isv = 15;

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
    }

    public static class InitialPaymentData {
        @Positive private Long monto;
        @NotBlank private String metodo;

        public Long getMonto() { return monto; }
        public void setMonto(Long monto) { this.monto = monto; }
        public String getMetodo() { return metodo; }
        public void setMetodo(String metodo) { this.metodo = metodo; }
    }

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }
    public String getRtn() { return rtn; }
    public void setRtn(String rtn) { this.rtn = rtn; }
    public Boolean getConRtn() { return conRtn; }
    public void setConRtn(Boolean conRtn) { this.conRtn = conRtn; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getVendedorId() { return vendedorId; }
    public void setVendedorId(String vendedorId) { this.vendedorId = vendedorId; }
    public List<InvoiceItemData> getItems() { return items; }
    public void setItems(List<InvoiceItemData> items) { this.items = items; }
    public InitialPaymentData getPagoInicial() { return pagoInicial; }
    public void setPagoInicial(InitialPaymentData pagoInicial) { this.pagoInicial = pagoInicial; }
}
