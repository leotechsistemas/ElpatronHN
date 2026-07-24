package com.patron.erp.repository;

import com.patron.erp.model.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReminderRepository extends JpaRepository<Reminder, String> {
    List<Reminder> findByCompletadoOrderByFechaAsc(Boolean completado);
}
