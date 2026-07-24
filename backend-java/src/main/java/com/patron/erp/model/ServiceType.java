package com.patron.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "service_types")
public class ServiceType {

    @Id
    private String id;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @Column(name = "precio_sugerido")
    private Long precioSugerido;

    @Column(nullable = false, length = 10)
    private String icono = "🔧";

    @Column(nullable = false)
    private Boolean activo = true;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public Long getPrecioSugerido() { return precioSugerido; }
    public void setPrecioSugerido(Long precioSugerido) { this.precioSugerido = precioSugerido; }
    public String getIcono() { return icono; }
    public void setIcono(String icono) { this.icono = icono; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
