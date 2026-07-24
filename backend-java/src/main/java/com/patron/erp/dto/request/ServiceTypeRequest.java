package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class ServiceTypeRequest {
    @NotBlank private String nombre;
    private String descripcion;
    @Positive private Long precioSugerido;
    private String icono;
    private Boolean activo;

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
