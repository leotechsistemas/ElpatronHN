package com.patron.erp.dto.response;

public class ServiceTypeResponse {
    private String id;
    private String nombre;
    private String descripcion;
    private Long precioSugerido;
    private String icono;
    private Boolean activo;

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
