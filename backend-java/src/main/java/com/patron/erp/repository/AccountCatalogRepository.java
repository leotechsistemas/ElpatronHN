package com.patron.erp.repository;

import com.patron.erp.model.AccountCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AccountCatalogRepository extends JpaRepository<AccountCatalog, String> {
    List<AccountCatalog> findByPadreIdOrderByCodigoAsc(String padreId);
    List<AccountCatalog> findByOrderByCodigoAsc();
    List<AccountCatalog> findByActivoTrueOrderByCodigoAsc();
}
