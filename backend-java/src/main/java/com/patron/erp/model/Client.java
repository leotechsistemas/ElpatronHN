package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    private String id;

    @Column(nullable = false)
    private String nombre;

    private String rtn;
    private String telefono;
    private String email;

    @Column(nullable = false)
    private String estado;

    private String observaciones;

    @Column(nullable = false)
    private String clasificacion;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDate fechaRegistro;

    @Column(nullable = false)
    private Long ltv = 0L;

    @Column(name = "rfm_score", nullable = false)
    private Integer rfmScore = 5;

    private String departamento;
    private String ciudad;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getRtn() { return rtn; }
    public void setRtn(String rtn) { this.rtn = rtn; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getClasificacion() { return clasificacion; }
    public void setClasificacion(String clasificacion) { this.clasificacion = clasificacion; }

    public LocalDate getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDate fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    public Long getLtv() { return ltv; }
    public void setLtv(Long ltv) { this.ltv = ltv; }

    public Integer getRfmScore() { return rfmScore; }
    public void setRfmScore(Integer rfmScore) { this.rfmScore = rfmScore; }

    public String getDepartamento() { return departamento; }
    public void setDepartamento(String departamento) { this.departamento = departamento; }

    public String getCiudad() { return ciudad; }
    public void setCiudad(String ciudad) { this.ciudad = ciudad; }
}
