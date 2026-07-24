package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "production_tasks")
public class ProductionTask {

    @Id
    private String id;

    @Column(name = "venta_id", nullable = false)
    private String ventaId;

    @Column(name = "cliente_id", nullable = false)
    private String clienteId;

    @Column(nullable = false)
    private String cliente;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private String estado = "Pendiente";

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "inicio_en")
    private LocalDateTime inicioEn;

    @Column(name = "completado_en")
    private LocalDateTime completadoEn;

    @Column(name = "vendedor_id")
    private String vendedorId;

    @Column(nullable = false)
    private String prioridad = "Media";

    @Column(name = "asignado_a")
    private String asignadoA;

    @Column(name = "notas_internas", columnDefinition = "TEXT")
    private String notasInternas;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getVentaId() { return ventaId; }
    public void setVentaId(String ventaId) { this.ventaId = ventaId; }

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }

    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }

    public LocalDateTime getInicioEn() { return inicioEn; }
    public void setInicioEn(LocalDateTime inicioEn) { this.inicioEn = inicioEn; }

    public LocalDateTime getCompletadoEn() { return completadoEn; }
    public void setCompletadoEn(LocalDateTime completadoEn) { this.completadoEn = completadoEn; }

    public String getVendedorId() { return vendedorId; }
    public void setVendedorId(String vendedorId) { this.vendedorId = vendedorId; }

    public String getPrioridad() { return prioridad; }
    public void setPrioridad(String prioridad) { this.prioridad = prioridad; }

    public String getAsignadoA() { return asignadoA; }
    public void setAsignadoA(String asignadoA) { this.asignadoA = asignadoA; }

    public String getNotasInternas() { return notasInternas; }
    public void setNotasInternas(String notasInternas) { this.notasInternas = notasInternas; }
}
