package com.patron.erp.dto.response;

public class PeriodoContableResponse {
    private Long id;
    private String codigo;
    private String fechaInicio;
    private String fechaFin;
    private Boolean cerrado;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(String fechaInicio) { this.fechaInicio = fechaInicio; }
    public String getFechaFin() { return fechaFin; }
    public void setFechaFin(String fechaFin) { this.fechaFin = fechaFin; }
    public Boolean getCerrado() { return cerrado; }
    public void setCerrado(Boolean cerrado) { this.cerrado = cerrado; }
}
