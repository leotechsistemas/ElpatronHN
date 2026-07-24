package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounting_entries")
public class AccountingEntry {

    @Id
    private String id;

    @Column(name = "numero_asiento", nullable = false, unique = true, length = 15)
    private String numeroAsiento;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, length = 500)
    private String concepto;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(name = "referencia_tipo")
    private String referenciaTipo;

    @Column(name = "referencia_id")
    private String referenciaId;

    @Column(name = "creado_por")
    private String creadoPor;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "total_debe", nullable = false)
    private Long totalDebe;

    @Column(name = "total_haber", nullable = false)
    private Long totalHaber;

    @Column(nullable = false)
    private Boolean reversado = false;

    @Column(name = "periodo_id")
    private Long periodoId;

    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNumeroAsiento() { return numeroAsiento; }
    public void setNumeroAsiento(String numeroAsiento) { this.numeroAsiento = numeroAsiento; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public String getConcepto() { return concepto; }
    public void setConcepto(String concepto) { this.concepto = concepto; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getReferenciaTipo() { return referenciaTipo; }
    public void setReferenciaTipo(String referenciaTipo) { this.referenciaTipo = referenciaTipo; }
    public String getReferenciaId() { return referenciaId; }
    public void setReferenciaId(String referenciaId) { this.referenciaId = referenciaId; }
    public String getCreadoPor() { return creadoPor; }
    public void setCreadoPor(String creadoPor) { this.creadoPor = creadoPor; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getTotalDebe() { return totalDebe; }
    public void setTotalDebe(Long totalDebe) { this.totalDebe = totalDebe; }
    public Long getTotalHaber() { return totalHaber; }
    public void setTotalHaber(Long totalHaber) { this.totalHaber = totalHaber; }
    public Boolean getReversado() { return reversado; }
    public void setReversado(Boolean reversado) { this.reversado = reversado; }
    public Long getPeriodoId() { return periodoId; }
    public void setPeriodoId(Long periodoId) { this.periodoId = periodoId; }
}
