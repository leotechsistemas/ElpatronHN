package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    private String id;

    @Column(name = "cliente_id", nullable = false)
    private String clienteId;

    @Column(nullable = false)
    private String cliente;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "monto_total", nullable = false)
    private Long montoTotal;

    @Column(nullable = false)
    private String metodo;

    @Column(nullable = false)
    private String estado;

    private String observaciones;

    @Column(name = "registrado_por")
    private String registradoPor;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "payment_id", referencedColumnName = "id")
    private List<PaymentItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }

    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public Long getMontoTotal() { return montoTotal; }
    public void setMontoTotal(Long montoTotal) { this.montoTotal = montoTotal; }

    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getRegistradoPor() { return registradoPor; }
    public void setRegistradoPor(String registradoPor) { this.registradoPor = registradoPor; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<PaymentItem> getItems() { return items; }
    public void setItems(List<PaymentItem> items) { this.items = items; }
}
