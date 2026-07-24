package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CampaignRequest {
    @NotBlank private String segmento;
    @NotBlank private String canal;
    @NotBlank private String plantilla;
    private String asunto;
    @NotBlank private String mensaje;

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
}
