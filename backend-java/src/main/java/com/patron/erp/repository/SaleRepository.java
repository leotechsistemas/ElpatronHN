package com.patron.erp.repository;

import com.patron.erp.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, String>, JpaSpecificationExecutor<Sale> {
    List<Sale> findByClienteIdOrderByFechaDesc(String clienteId);
    List<Sale> findByVendedorIdOrderByFechaDesc(String vendedorId);
}
