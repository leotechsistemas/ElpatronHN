package com.patron.erp.repository;

import com.patron.erp.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ClientRepository extends JpaRepository<Client, String>, JpaSpecificationExecutor<Client> {
}
