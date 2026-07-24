package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "periodo_contable")
public class PeriodoContable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 7)
    private String codigo;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(nullable = false)
    private Boolean cerrado = false;

    @Column(name = "cerrado_por")
    private String cerradoPor;

    @Column(name = "cerrado_en")
    private LocalDateTime cerradoEn;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }
    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }
    public Boolean getCerrado() { return cerrado; }
    public void setCerrado(Boolean cerrado) { this.cerrado = cerrado; }
    public String getCerradoPor() { return cerradoPor; }
    public void setCerradoPor(String cerradoPor) { this.cerradoPor = cerradoPor; }
    public LocalDateTime getCerradoEn() { return cerradoEn; }
    public void setCerradoEn(LocalDateTime cerradoEn) { this.cerradoEn = cerradoEn; }
}
