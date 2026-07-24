package com.patron.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "accounting_entry_items")
public class AccountingEntryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asiento_id", nullable = false)
    private String asientoId;

    @Column(name = "cuenta_id", nullable = false)
    private String cuentaId;

    @Column(nullable = false)
    private Long debe;

    @Column(nullable = false)
    private Long haber;

    @Column(length = 500)
    private String glosa;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAsientoId() { return asientoId; }
    public void setAsientoId(String asientoId) { this.asientoId = asientoId; }
    public String getCuentaId() { return cuentaId; }
    public void setCuentaId(String cuentaId) { this.cuentaId = cuentaId; }
    public Long getDebe() { return debe; }
    public void setDebe(Long debe) { this.debe = debe; }
    public Long getHaber() { return haber; }
    public void setHaber(Long haber) { this.haber = haber; }
    public String getGlosa() { return glosa; }
    public void setGlosa(String glosa) { this.glosa = glosa; }
}
