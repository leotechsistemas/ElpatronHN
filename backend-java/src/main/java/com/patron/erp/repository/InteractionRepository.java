package com.patron.erp.repository;

import com.patron.erp.model.Interaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InteractionRepository extends JpaRepository<Interaction, String> {
    List<Interaction> findByClienteIdOrderByFechaDesc(String clienteId);
}
