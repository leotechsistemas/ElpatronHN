package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaigns")
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String segmento;

    @Column(nullable = false, length = 15)
    private String canal;

    @Column(nullable = false, length = 20)
    private String plantilla;

    @Column(length = 300)
    private String asunto;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @Column(name = "clientes_count", nullable = false)
    private Integer clientesCount = 0;

    @Column(name = "enviados_count", nullable = false)
    private Integer enviadosCount = 0;

    @Column(nullable = false, length = 15)
    private String estado = "Enviado";

    @Column(name = "creado_por", length = 20)
    private String creadoPor;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String logs;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSegmento() { return segmento; }
    public void setSegmento(String segmento) { this.segmento = segmento; }

    public String getCanal() { return canal; }
    public void setCanal(String canal) { this.canal = canal; }

    public String getPlantilla() { return plantilla; }
    public void setPlantilla(String plantilla) { this.plantilla = plantilla; }

    public String getAsunto() { return asunto; }
    public void setAsunto(String asunto) { this.asunto = asunto; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public Integer getClientesCount() { return clientesCount; }
    public void setClientesCount(Integer clientesCount) { this.clientesCount = clientesCount; }

    public Integer getEnviadosCount() { return enviadosCount; }
    public void setEnviadosCount(Integer enviadosCount) { this.enviadosCount = enviadosCount; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getCreadoPor() { return creadoPor; }
    public void setCreadoPor(String creadoPor) { this.creadoPor = creadoPor; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }

    public String getLogs() { return logs; }
    public void setLogs(String logs) { this.logs = logs; }
}
