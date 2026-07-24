package com.patron.erp.repository;

import com.patron.erp.model.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceTypeRepository extends JpaRepository<ServiceType, String> {
    List<ServiceType> findByActivoTrueOrderByNombre();
    java.util.Optional<ServiceType> findByNombre(String nombre);
}
