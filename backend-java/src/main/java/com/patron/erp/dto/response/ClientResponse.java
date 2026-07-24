package com.patron.erp.dto.response;

public class ClientResponse {
    private String id; private String nombre; private String rtn; private String telefono; private String email;
    private String estado; private String observaciones; private String clasificacion;
    private String fechaRegistro; private Long ltv; private Integer rfmScore;
    private String departamento; private String ciudad;

    public String getId() { return id; } public void setId(String id) { this.id = id; }
    public String getNombre() { return nombre; } public void setNombre(String nombre) { this.nombre = nombre; }
    public String getRtn() { return rtn; } public void setRtn(String rtn) { this.rtn = rtn; }
    public String getTelefono() { return telefono; } public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
    public String getEstado() { return estado; } public void setEstado(String estado) { this.estado = estado; }
    public String getObservaciones() { return observaciones; } public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getClasificacion() { return clasificacion; } public void setClasificacion(String clasificacion) { this.clasificacion = clasificacion; }
    public String getFechaRegistro() { return fechaRegistro; } public void setFechaRegistro(String fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    public Long getLtv() { return ltv; } public void setLtv(Long ltv) { this.ltv = ltv; }
    public Integer getRfmScore() { return rfmScore; } public void setRfmScore(Integer rfmScore) { this.rfmScore = rfmScore; }
    public String getDepartamento() { return departamento; } public void setDepartamento(String departamento) { this.departamento = departamento; }
    public String getCiudad() { return ciudad; } public void setCiudad(String ciudad) { this.ciudad = ciudad; }
}
