package com.patron.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "account_catalog")
public class AccountCatalog {

    @Id
    private String id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(nullable = false, length = 15)
    private String tipo;

    @Column(nullable = false)
    private Integer nivel;

    @Column(name = "padre_id")
    private String padreId;

    @Column(name = "acepta_asientos", nullable = false)
    private Boolean aceptaAsientos;

    @Column(nullable = false)
    private Boolean activo;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Integer getNivel() { return nivel; }
    public void setNivel(Integer nivel) { this.nivel = nivel; }
    public String getPadreId() { return padreId; }
    public void setPadreId(String padreId) { this.padreId = padreId; }
    public Boolean getAceptaAsientos() { return aceptaAsientos; }
    public void setAceptaAsientos(Boolean aceptaAsientos) { this.aceptaAsientos = aceptaAsientos; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
