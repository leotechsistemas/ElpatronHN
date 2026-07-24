package com.patron.erp.repository;

import com.patron.erp.model.PaymentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentItemRepository extends JpaRepository<PaymentItem, Long> {
    List<PaymentItem> findByVentaId(String ventaId);

    @Modifying
    @Query("delete from PaymentItem pi where pi.paymentId = :paymentId")
    void deleteByPaymentId(@Param("paymentId") String paymentId);
}
