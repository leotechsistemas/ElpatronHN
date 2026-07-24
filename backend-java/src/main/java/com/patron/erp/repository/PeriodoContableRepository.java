package com.patron.erp.repository;

import com.patron.erp.model.PeriodoContable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface PeriodoContableRepository extends JpaRepository<PeriodoContable, Long> {
    Optional<PeriodoContable> findByCodigo(String codigo);

    default Optional<PeriodoContable> findPeriodoForDate(LocalDate fecha) {
        return findAll().stream()
            .filter(p -> !fecha.isBefore(p.getFechaInicio()) && !fecha.isAfter(p.getFechaFin()))
            .findFirst();
    }
}
