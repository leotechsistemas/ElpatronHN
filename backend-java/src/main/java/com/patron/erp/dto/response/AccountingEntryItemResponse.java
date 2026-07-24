package com.patron.erp.dto.response;

public class AccountingEntryItemResponse {
    private Long id;
    private String asientoId;
    private String cuentaId;
    private String cuentaCodigo;
    private String cuentaNombre;
    private Long debe;
    private Long haber;
    private String glosa;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAsientoId() { return asientoId; }
    public void setAsientoId(String asientoId) { this.asientoId = asientoId; }
    public String getCuentaId() { return cuentaId; }
    public void setCuentaId(String cuentaId) { this.cuentaId = cuentaId; }
    public String getCuentaCodigo() { return cuentaCodigo; }
    public void setCuentaCodigo(String cuentaCodigo) { this.cuentaCodigo = cuentaCodigo; }
    public String getCuentaNombre() { return cuentaNombre; }
    public void setCuentaNombre(String cuentaNombre) { this.cuentaNombre = cuentaNombre; }
    public Long getDebe() { return debe; }
    public void setDebe(Long debe) { this.debe = debe; }
    public Long getHaber() { return haber; }
    public void setHaber(Long haber) { this.haber = haber; }
    public String getGlosa() { return glosa; }
    public void setGlosa(String glosa) { this.glosa = glosa; }
}
