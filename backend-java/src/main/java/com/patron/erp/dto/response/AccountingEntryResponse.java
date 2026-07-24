package com.patron.erp.dto.response;

import java.util.List;

public class AccountingEntryResponse {
    private String id;
    private String numeroAsiento;
    private String fecha;
    private String concepto;
    private String tipo;
    private String referenciaTipo;
    private String referenciaId;
    private String creadoPor;
    private String createdAt;
    private Long totalDebe;
    private Long totalHaber;
    private Boolean reversado;
    private List<AccountingEntryItemResponse> items;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNumeroAsiento() { return numeroAsiento; }
    public void setNumeroAsiento(String numeroAsiento) { this.numeroAsiento = numeroAsiento; }
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
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public Long getTotalDebe() { return totalDebe; }
    public void setTotalDebe(Long totalDebe) { this.totalDebe = totalDebe; }
    public Long getTotalHaber() { return totalHaber; }
    public void setTotalHaber(Long totalHaber) { this.totalHaber = totalHaber; }
    public Boolean getReversado() { return reversado; }
    public void setReversado(Boolean reversado) { this.reversado = reversado; }
    public List<AccountingEntryItemResponse> getItems() { return items; }
    public void setItems(List<AccountingEntryItemResponse> items) { this.items = items; }
}
