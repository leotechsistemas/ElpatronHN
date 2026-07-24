package com.patron.erp.dto.response;

import java.util.List;

public class CampaignResponse {
    private Long id;
    private String segmento;
    private String canal;
    private String plantilla;
    private String asunto;
    private String mensaje;
    private Integer clientesCount;
    private Integer enviadosCount;
    private String estado;
    private String creadoEn;
    private List<String> logs;

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
    public String getCreadoEn() { return creadoEn; }
    public void setCreadoEn(String creadoEn) { this.creadoEn = creadoEn; }
    public List<String> getLogs() { return logs; }
    public void setLogs(List<String> logs) { this.logs = logs; }
}
