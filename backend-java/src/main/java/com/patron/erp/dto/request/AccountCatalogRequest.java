package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AccountCatalogRequest {
    @NotBlank private String codigo;
    @NotBlank private String nombre;
    @NotBlank private String tipo;
    @NotNull private Integer nivel;
    private String padreId;
    private Boolean aceptaAsientos;

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
}
