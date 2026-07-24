package com.patron.erp.dto.response;

import java.util.List;

public class BalanceResponse {
    private String fecha;
    private Long totalActivos;
    private Long totalPasivos;
    private Long totalPatrimonio;
    private List<BalanceItem> activos;
    private List<BalanceItem> pasivos;
    private List<BalanceItem> patrimonio;

    public static class BalanceItem {
        private String cuentaId;
        private String cuentaCodigo;
        private String cuentaNombre;
        private Long saldo;

        public String getCuentaId() { return cuentaId; }
        public void setCuentaId(String cuentaId) { this.cuentaId = cuentaId; }
        public String getCuentaCodigo() { return cuentaCodigo; }
        public void setCuentaCodigo(String cuentaCodigo) { this.cuentaCodigo = cuentaCodigo; }
        public String getCuentaNombre() { return cuentaNombre; }
        public void setCuentaNombre(String cuentaNombre) { this.cuentaNombre = cuentaNombre; }
        public Long getSaldo() { return saldo; }
        public void setSaldo(Long saldo) { this.saldo = saldo; }
    }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public Long getTotalActivos() { return totalActivos; }
    public void setTotalActivos(Long totalActivos) { this.totalActivos = totalActivos; }
    public Long getTotalPasivos() { return totalPasivos; }
    public void setTotalPasivos(Long totalPasivos) { this.totalPasivos = totalPasivos; }
    public Long getTotalPatrimonio() { return totalPatrimonio; }
    public void setTotalPatrimonio(Long totalPatrimonio) { this.totalPatrimonio = totalPatrimonio; }
    public List<BalanceItem> getActivos() { return activos; }
    public void setActivos(List<BalanceItem> activos) { this.activos = activos; }
    public List<BalanceItem> getPasivos() { return pasivos; }
    public void setPasivos(List<BalanceItem> pasivos) { this.pasivos = pasivos; }
    public List<BalanceItem> getPatrimonio() { return patrimonio; }
    public void setPatrimonio(List<BalanceItem> patrimonio) { this.patrimonio = patrimonio; }
}
