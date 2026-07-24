package com.patron.erp.repository;

import com.patron.erp.model.AccountingEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AccountingEntryRepository extends JpaRepository<AccountingEntry, String>, JpaSpecificationExecutor<AccountingEntry> {
    List<AccountingEntry> findByReferenciaTipoAndReferenciaId(String referenciaTipo, String referenciaId);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(e.numeroAsiento, 13) AS integer)), 0) " +
           "FROM AccountingEntry e " +
           "WHERE e.numeroAsiento LIKE :prefix%")
    Integer findLastCorrelativeByPrefix(@Param("prefix") String prefix);
}
