package com.patron.erp.repository;

import com.patron.erp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u.department, COUNT(u) FROM User u WHERE u.active = true GROUP BY u.department ORDER BY u.department")
    List<Object[]> countByDepartment();

    @Query("SELECT u.position, COUNT(u) FROM User u WHERE u.active = true GROUP BY u.position ORDER BY u.position")
    List<Object[]> countByPosition();

    List<User> findByActiveTrueOrderByName();
    List<User> findByDepartment(String department);
}
