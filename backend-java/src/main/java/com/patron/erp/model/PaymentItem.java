package com.patron.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "payment_items")
public class PaymentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_id", nullable = false, length = 20)
    private String paymentId;

    @Column(name = "venta_id", nullable = false, length = 20)
    private String ventaId;

    @Column(name = "monto_asignado", nullable = false)
    private Long montoAsignado;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getVentaId() { return ventaId; }
    public void setVentaId(String ventaId) { this.ventaId = ventaId; }

    public Long getMontoAsignado() { return montoAsignado; }
    public void setMontoAsignado(Long montoAsignado) { this.montoAsignado = montoAsignado; }
}
