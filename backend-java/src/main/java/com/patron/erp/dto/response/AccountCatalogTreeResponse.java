package com.patron.erp.dto.response;

import java.util.List;

public class AccountCatalogTreeResponse {
    private String id;
    private String codigo;
    private String nombre;
    private String tipo;
    private Integer nivel;
    private String padreId;
    private Boolean aceptaAsientos;
    private Boolean activo;
    private List<AccountCatalogTreeResponse> hijos;

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
    public List<AccountCatalogTreeResponse> getHijos() { return hijos; }
    public void setHijos(List<AccountCatalogTreeResponse> hijos) { this.hijos = hijos; }
}
