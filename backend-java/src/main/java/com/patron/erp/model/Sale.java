package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "sales")
public class Sale {

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

    @Column(name = "producto_id")
    private String productoId;

    private String producto;

    @Column(name = "tipo_trabajo", nullable = false)
    private String tipoTrabajo;

    @Column(nullable = false)
    private Long precio;

    @Column(nullable = false)
    private String estado;

    @Column(name = "pago_inicial", nullable = false)
    private Long pagoInicial;

    @Column(name = "estado_pago", nullable = false)
    private String estadoPago;

    private String observaciones;

    @Column(name = "vendedor_id")
    private String vendedorId;

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

    public String getProductoId() { return productoId; }
    public void setProductoId(String productoId) { this.productoId = productoId; }

    public String getProducto() { return producto; }
    public void setProducto(String producto) { this.producto = producto; }

    public String getTipoTrabajo() { return tipoTrabajo; }
    public void setTipoTrabajo(String tipoTrabajo) { this.tipoTrabajo = tipoTrabajo; }

    public Long getPrecio() { return precio; }
    public void setPrecio(Long precio) { this.precio = precio; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Long getPagoInicial() { return pagoInicial; }
    public void setPagoInicial(Long pagoInicial) { this.pagoInicial = pagoInicial; }

    public String getEstadoPago() { return estadoPago; }
    public void setEstadoPago(String estadoPago) { this.estadoPago = estadoPago; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getVendedorId() { return vendedorId; }
    public void setVendedorId(String vendedorId) { this.vendedorId = vendedorId; }
}
