package com.patron.erp.repository;

import com.patron.erp.model.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockLogRepository extends JpaRepository<StockLog, String> {
    List<StockLog> findByProductoIdOrderByFechaDesc(String productoId);
}
