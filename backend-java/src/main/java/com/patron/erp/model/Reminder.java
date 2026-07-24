package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "reminders")
public class Reminder {

    @Id
    private String id;

    @Column(name = "cliente_id")
    private String clienteId;

    private String cliente;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private String descripcion;

    private String prioridad;

    @Column(nullable = false)
    private Boolean completado = false;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }

    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getPrioridad() { return prioridad; }
    public void setPrioridad(String prioridad) { this.prioridad = prioridad; }

    public Boolean getCompletado() { return completado; }
    public void setCompletado(Boolean completado) { this.completado = completado; }
}
