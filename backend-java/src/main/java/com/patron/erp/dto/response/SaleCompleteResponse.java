package com.patron.erp.dto.response;

import java.util.List;

public class SaleCompleteResponse {
    private SaleResponse sale;
    private List<InvoiceItemResponse> items;
    private List<ProductionTaskResponse> productionTasks;
    private PaymentResponse payment;

    public SaleResponse getSale() { return sale; }
    public void setSale(SaleResponse sale) { this.sale = sale; }
    public List<InvoiceItemResponse> getItems() { return items; }
    public void setItems(List<InvoiceItemResponse> items) { this.items = items; }
    public List<ProductionTaskResponse> getProductionTasks() { return productionTasks; }
    public void setProductionTasks(List<ProductionTaskResponse> productionTasks) { this.productionTasks = productionTasks; }
    public PaymentResponse getPayment() { return payment; }
    public void setPayment(PaymentResponse payment) { this.payment = payment; }
}
