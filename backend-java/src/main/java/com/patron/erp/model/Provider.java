package com.patron.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "providers")
public class Provider {

    @Id
    private String id;

    @Column(nullable = false)
    private String nombre;

    private String contacto;
    private String telefono;
    private String email;
    private String observaciones;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getContacto() { return contacto; }
    public void setContacto(String contacto) { this.contacto = contacto; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
