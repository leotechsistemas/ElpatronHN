package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "quotations")
public class Quotation {

    @Id
    private String id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "cliente_id", nullable = false)
    private String clienteId;

    @Column(nullable = false)
    private String cliente;

    private String rtn;

    @Column(name = "con_rtn", nullable = false)
    private Boolean conRtn = true;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String items;

    @Column(name = "precio_total", nullable = false)
    private Long precioTotal;

    @Column(nullable = false)
    private Long descuento = 0L;

    @Column(nullable = false)
    private Integer isv = 15;

    @Column(name = "fecha_expiracion")
    private LocalDate fechaExpiracion;

    @Column(nullable = false)
    private String estado;

    private String observaciones;

    @Column(name = "vendedor_id")
    private String vendedorId;

    public LocalDate getFechaExpiracion() { return fechaExpiracion; }
    public void setFechaExpiracion(LocalDate fechaExpiracion) { this.fechaExpiracion = fechaExpiracion; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }

    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }

    public String getRtn() { return rtn; }
    public void setRtn(String rtn) { this.rtn = rtn; }

    public Boolean getConRtn() { return conRtn; }
    public void setConRtn(Boolean conRtn) { this.conRtn = conRtn; }

    public String getItems() { return items; }
    public void setItems(String items) { this.items = items; }

    public Long getPrecioTotal() { return precioTotal; }
    public void setPrecioTotal(Long precioTotal) { this.precioTotal = precioTotal; }

    public Long getDescuento() { return descuento; }
    public void setDescuento(Long descuento) { this.descuento = descuento; }

    public Integer getIsv() { return isv; }
    public void setIsv(Integer isv) { this.isv = isv; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getVendedorId() { return vendedorId; }
    public void setVendedorId(String vendedorId) { this.vendedorId = vendedorId; }
}
