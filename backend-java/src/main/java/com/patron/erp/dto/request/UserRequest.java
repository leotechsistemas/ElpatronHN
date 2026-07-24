package com.patron.erp.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserRequest {
    @NotBlank private String nombre;
    @NotBlank @Email private String correo;
    private String contrasena;
    @NotBlank private String rol;
    private String dni;
    private String telefono;
    private String direccion;
    private String puesto;
    private String departamento;
    private Long salario;
    private String fechaContratacion;
    private String fechaNacimiento;
    private String contactoEmergencia;
    private String telefonoEmergencia;

    public @NotBlank String getNombre() { return nombre; }
    public void setNombre(@NotBlank String nombre) { this.nombre = nombre; }
    public @NotBlank @Email String getCorreo() { return correo; }
    public void setCorreo(@NotBlank @Email String correo) { this.correo = correo; }
    public String getContrasena() { return contrasena; }
    public void setContrasena(String contrasena) { this.contrasena = contrasena; }
    public @NotBlank String getRol() { return rol; }
    public void setRol(@NotBlank String rol) { this.rol = rol; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getPuesto() { return puesto; }
    public void setPuesto(String puesto) { this.puesto = puesto; }
    public String getDepartamento() { return departamento; }
    public void setDepartamento(String departamento) { this.departamento = departamento; }
    public Long getSalario() { return salario; }
    public void setSalario(Long salario) { this.salario = salario; }
    public String getFechaContratacion() { return fechaContratacion; }
    public void setFechaContratacion(String fechaContratacion) { this.fechaContratacion = fechaContratacion; }
    public String getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(String fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    public String getContactoEmergencia() { return contactoEmergencia; }
    public void setContactoEmergencia(String contactoEmergencia) { this.contactoEmergencia = contactoEmergencia; }
    public String getTelefonoEmergencia() { return telefonoEmergencia; }
    public void setTelefonoEmergencia(String telefonoEmergencia) { this.telefonoEmergencia = telefonoEmergencia; }
}
