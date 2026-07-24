package com.patron.erp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class AccountingEntryRequest {
    @NotBlank private String fecha;
    @NotBlank private String concepto;
    @NotBlank private String tipo;
    private String referenciaTipo;
    private String referenciaId;
    private String creadoPor;
    @NotEmpty private List<EntryItem> items;

    public static class EntryItem {
        @NotBlank private String cuentaId;
        @NotNull private Long debe;
        @NotNull private Long haber;
        private String glosa;

        public String getCuentaId() { return cuentaId; }
        public void setCuentaId(String cuentaId) { this.cuentaId = cuentaId; }
        public Long getDebe() { return debe; }
        public void setDebe(Long debe) { this.debe = debe; }
        public Long getHaber() { return haber; }
        public void setHaber(Long haber) { this.haber = haber; }
        public String getGlosa() { return glosa; }
        public void setGlosa(String glosa) { this.glosa = glosa; }
    }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public String getConcepto() { return concepto; }
    public void setConcepto(String concepto) { this.concepto = concepto; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getReferenciaTipo() { return referenciaTipo; }
    public void setReferenciaTipo(String referenciaTipo) { this.referenciaTipo = referenciaTipo; }
    public String getReferenciaId() { return referenciaId; }
    public void setReferenciaId(String referenciaId) { this.referenciaId = referenciaId; }
    public String getCreadoPor() { return creadoPor; }
    public void setCreadoPor(String creadoPor) { this.creadoPor = creadoPor; }
    public List<EntryItem> getItems() { return items; }
    public void setItems(List<EntryItem> items) { this.items = items; }
}
