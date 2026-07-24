package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario", length = 150)
    private String usuario;

    @Column(name = "accion", nullable = false, length = 10)
    private String accion;

    @Column(name = "entidad", nullable = false, length = 50)
    private String entidad;

    @Column(name = "entidad_id", length = 30)
    private String entidadId;

    @Column(name = "detalle", columnDefinition = "TEXT")
    private String detalle;

    @Column(name = "ip", length = 45)
    private String ip;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();

    public AuditLog() {}

    public AuditLog(String usuario, String accion, String entidad, String entidadId, String detalle, String ip) {
        this.usuario = usuario;
        this.accion = accion;
        this.entidad = entidad;
        this.entidadId = entidadId;
        this.detalle = detalle;
        this.ip = ip;
    }

    public Long getId() { return id; }
    public String getUsuario() { return usuario; }
    public String getAccion() { return accion; }
    public String getEntidad() { return entidad; }
    public String getEntidadId() { return entidadId; }
    public String getDetalle() { return detalle; }
    public String getIp() { return ip; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
