package com.patron.erp.repository;

import com.patron.erp.model.ProductionTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductionTaskRepository extends JpaRepository<ProductionTask, String> {
    List<ProductionTask> findByVentaId(String ventaId);
    List<ProductionTask> findByEstadoOrderByCreadoEnAsc(String estado);
}
