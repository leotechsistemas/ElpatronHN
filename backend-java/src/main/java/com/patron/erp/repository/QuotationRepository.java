package com.patron.erp.repository;

import com.patron.erp.model.Quotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface QuotationRepository extends JpaRepository<Quotation, String> {
    List<Quotation> findByClienteIdOrderByFechaDesc(String clienteId);

    @Query("SELECT q FROM Quotation q WHERE q.estado = 'Pendiente' AND q.fechaExpiracion IS NOT NULL AND q.fechaExpiracion < :today")
    List<Quotation> findExpiredPendientes(@Param("today") LocalDate today);

    Page<Quotation> findByEstadoOrderByFechaDesc(String estado, Pageable pageable);
    List<Quotation> findByFechaExpiracionIsNull();
}
