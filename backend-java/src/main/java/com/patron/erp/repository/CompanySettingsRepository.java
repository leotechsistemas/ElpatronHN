package com.patron.erp.repository;

import com.patron.erp.model.CompanySettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanySettingsRepository extends JpaRepository<CompanySettings, String> {
}
