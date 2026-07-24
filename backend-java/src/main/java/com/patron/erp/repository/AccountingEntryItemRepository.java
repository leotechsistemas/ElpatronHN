package com.patron.erp.repository;

import com.patron.erp.model.AccountingEntryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AccountingEntryItemRepository extends JpaRepository<AccountingEntryItem, Long> {
    List<AccountingEntryItem> findByAsientoId(String asientoId);
    List<AccountingEntryItem> findByCuentaId(String cuentaId);
}
