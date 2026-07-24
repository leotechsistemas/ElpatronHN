package com.patron.erp.dto.response;

import java.util.List;

public class IncomeStatementResponse {
    private String fecha;
    private Long totalIngresos;
    private Long totalGastos;
    private Long resultadoNeto;
    private List<IncomeItem> ingresos;
    private List<IncomeItem> gastos;

    public static class IncomeItem {
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
    public Long getTotalIngresos() { return totalIngresos; }
    public void setTotalIngresos(Long totalIngresos) { this.totalIngresos = totalIngresos; }
    public Long getTotalGastos() { return totalGastos; }
    public void setTotalGastos(Long totalGastos) { this.totalGastos = totalGastos; }
    public Long getResultadoNeto() { return resultadoNeto; }
    public void setResultadoNeto(Long resultadoNeto) { this.resultadoNeto = resultadoNeto; }
    public List<IncomeItem> getIngresos() { return ingresos; }
    public void setIngresos(List<IncomeItem> ingresos) { this.ingresos = ingresos; }
    public List<IncomeItem> getGastos() { return gastos; }
    public void setGastos(List<IncomeItem> gastos) { this.gastos = gastos; }
}
