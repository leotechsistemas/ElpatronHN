package com.patron.erp.dto.response;

import java.util.List;
import java.util.Map;

public class DashboardResponse {
    private Long todaySalesCount;
    private Long todaySalesTotal;
    private Long totalRevenue;
    private Long lowStockCount;
    private Long pendingPaymentsTotal;
    private Long pendingPaymentsCount;
    private Long activeClientsCount;
    private Long newClientsCount;
    private List<Map<String, Object>> salesByMonth;
    private List<Map<String, Object>> topProducts;
    private Map<String, Long> agingBuckets;
    private Long periodRevenue;
    private Long periodSalesCount;
    private Long periodSalesTotal;
    private List<Map<String, Object>> pendingSales;

    public Long getTodaySalesCount() { return todaySalesCount; }
    public void setTodaySalesCount(Long todaySalesCount) { this.todaySalesCount = todaySalesCount; }
    public Long getTodaySalesTotal() { return todaySalesTotal; }
    public void setTodaySalesTotal(Long todaySalesTotal) { this.todaySalesTotal = todaySalesTotal; }
    public Long getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(Long totalRevenue) { this.totalRevenue = totalRevenue; }
    public Long getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(Long lowStockCount) { this.lowStockCount = lowStockCount; }
    public Long getPendingPaymentsTotal() { return pendingPaymentsTotal; }
    public void setPendingPaymentsTotal(Long pendingPaymentsTotal) { this.pendingPaymentsTotal = pendingPaymentsTotal; }
    public Long getPendingPaymentsCount() { return pendingPaymentsCount; }
    public void setPendingPaymentsCount(Long pendingPaymentsCount) { this.pendingPaymentsCount = pendingPaymentsCount; }
    public Long getActiveClientsCount() { return activeClientsCount; }
    public void setActiveClientsCount(Long activeClientsCount) { this.activeClientsCount = activeClientsCount; }
    public Long getNewClientsCount() { return newClientsCount; }
    public void setNewClientsCount(Long newClientsCount) { this.newClientsCount = newClientsCount; }
    public List<Map<String, Object>> getSalesByMonth() { return salesByMonth; }
    public void setSalesByMonth(List<Map<String, Object>> salesByMonth) { this.salesByMonth = salesByMonth; }
    public List<Map<String, Object>> getTopProducts() { return topProducts; }
    public void setTopProducts(List<Map<String, Object>> topProducts) { this.topProducts = topProducts; }
    public Map<String, Long> getAgingBuckets() { return agingBuckets; }
    public void setAgingBuckets(Map<String, Long> agingBuckets) { this.agingBuckets = agingBuckets; }
    public Long getPeriodRevenue() { return periodRevenue; }
    public void setPeriodRevenue(Long periodRevenue) { this.periodRevenue = periodRevenue; }
    public Long getPeriodSalesCount() { return periodSalesCount; }
    public void setPeriodSalesCount(Long periodSalesCount) { this.periodSalesCount = periodSalesCount; }
    public Long getPeriodSalesTotal() { return periodSalesTotal; }
    public void setPeriodSalesTotal(Long periodSalesTotal) { this.periodSalesTotal = periodSalesTotal; }
    public List<Map<String, Object>> getPendingSales() { return pendingSales; }
    public void setPendingSales(List<Map<String, Object>> pendingSales) { this.pendingSales = pendingSales; }
}
