package com.patron.erp.repository;

import com.patron.erp.model.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, String> {
    List<InvoiceItem> findByVentaIdOrderByTipoItem(String ventaId);
    void deleteByVentaId(String ventaId);
}
