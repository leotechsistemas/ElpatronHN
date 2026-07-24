package com.patron.erp.dto.response;

import java.util.List;

public class LedgerResponse {
    private String cuentaId;
    private String cuentaCodigo;
    private String cuentaNombre;
    private Long saldoInicial;
    private Long totalDebe;
    private Long totalHaber;
    private Long saldoFinal;
    private List<LedgerItem> movimientos;

    public static class LedgerItem {
        private String fecha;
        private String concepto;
        private String asientoId;
        private String numeroAsiento;
        private String referenciaTipo;
        private String referenciaId;
        private Long debe;
        private Long haber;
        private Long saldo;

        public String getFecha() { return fecha; }
        public void setFecha(String fecha) { this.fecha = fecha; }
        public String getConcepto() { return concepto; }
        public void setConcepto(String concepto) { this.concepto = concepto; }
        public String getAsientoId() { return asientoId; }
        public void setAsientoId(String asientoId) { this.asientoId = asientoId; }
        public String getNumeroAsiento() { return numeroAsiento; }
        public void setNumeroAsiento(String numeroAsiento) { this.numeroAsiento = numeroAsiento; }
        public String getReferenciaTipo() { return referenciaTipo; }
        public void setReferenciaTipo(String referenciaTipo) { this.referenciaTipo = referenciaTipo; }
        public String getReferenciaId() { return referenciaId; }
        public void setReferenciaId(String referenciaId) { this.referenciaId = referenciaId; }
        public Long getDebe() { return debe; }
        public void setDebe(Long debe) { this.debe = debe; }
        public Long getHaber() { return haber; }
        public void setHaber(Long haber) { this.haber = haber; }
        public Long getSaldo() { return saldo; }
        public void setSaldo(Long saldo) { this.saldo = saldo; }
    }

    public String getCuentaId() { return cuentaId; }
    public void setCuentaId(String cuentaId) { this.cuentaId = cuentaId; }
    public String getCuentaCodigo() { return cuentaCodigo; }
    public void setCuentaCodigo(String cuentaCodigo) { this.cuentaCodigo = cuentaCodigo; }
    public String getCuentaNombre() { return cuentaNombre; }
    public void setCuentaNombre(String cuentaNombre) { this.cuentaNombre = cuentaNombre; }
    public Long getSaldoInicial() { return saldoInicial; }
    public void setSaldoInicial(Long saldoInicial) { this.saldoInicial = saldoInicial; }
    public Long getTotalDebe() { return totalDebe; }
    public void setTotalDebe(Long totalDebe) { this.totalDebe = totalDebe; }
    public Long getTotalHaber() { return totalHaber; }
    public void setTotalHaber(Long totalHaber) { this.totalHaber = totalHaber; }
    public Long getSaldoFinal() { return saldoFinal; }
    public void setSaldoFinal(Long saldoFinal) { this.saldoFinal = saldoFinal; }
    public List<LedgerItem> getMovimientos() { return movimientos; }
    public void setMovimientos(List<LedgerItem> movimientos) { this.movimientos = movimientos; }
}
