package com.patron.erp.service;

import com.patron.erp.dto.response.DashboardResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import com.patron.erp.model.Sale;
import com.patron.erp.repository.SaleRepository;
import java.util.*;
import java.time.LocalDate;
import java.util.stream.Collectors;
import java.util.Objects;

@Service
public class DashboardService {

    private final EntityManager em;
    private final SaleRepository saleRepository;

    public DashboardService(EntityManager em, SaleRepository saleRepository) {
        this.em = em;
        this.saleRepository = saleRepository;
    }

    @SuppressWarnings("unchecked")
    public DashboardResponse getDashboard(String period) {
        DashboardResponse r = new DashboardResponse();

        LocalDate periodStart = calcPeriodStart(period);

        Query qTodaySales = em.createNativeQuery(
            "SELECT COUNT(*) as c, COALESCE(SUM(precio), 0) as t FROM sales WHERE fecha = ?1");
        qTodaySales.setParameter(1, LocalDate.now());
        Object[] today = (Object[]) qTodaySales.getSingleResult();
        r.setTodaySalesCount(((Number) today[0]).longValue());
        r.setTodaySalesTotal(toLong(today[1]));

        Query qRevenue = em.createNativeQuery(
            "SELECT COALESCE(SUM(monto_total), 0) FROM payments WHERE estado = 'Pagado' AND fecha >= ?1");
        qRevenue.setParameter(1, periodStart);
        r.setTotalRevenue(toLong(qRevenue.getSingleResult()));

        Query qLowStock = em.createNativeQuery(
            "SELECT COUNT(*) FROM products WHERE stock_actual <= alerta_stock");
        r.setLowStockCount(((Number) qLowStock.getSingleResult()).longValue());

        Query qPending = em.createNativeQuery(
            "SELECT COALESCE(SUM(precio - COALESCE(pago_inicial, 0)), 0) as t, COUNT(*) as c FROM sales WHERE estado_pago != 'Pagado'");
        Object[] pending = (Object[]) qPending.getSingleResult();
        r.setPendingPaymentsTotal(toLong(pending[0]));
        r.setPendingPaymentsCount(((Number) pending[1]).longValue());

        Query qClients = em.createNativeQuery(
            "SELECT COUNT(*) FROM clients WHERE estado = 'Activo'");
        r.setActiveClientsCount(((Number) qClients.getSingleResult()).longValue());

        Query qNewClients = em.createNativeQuery(
            "SELECT COUNT(*) FROM clients WHERE fecha_registro >= ?1");
        qNewClients.setParameter(1, periodStart);
        r.setNewClientsCount(((Number) qNewClients.getSingleResult()).longValue());

        Query qPeriodSales = em.createNativeQuery(
            "SELECT COUNT(*), COALESCE(SUM(precio), 0) FROM sales WHERE fecha >= ?1");
        qPeriodSales.setParameter(1, periodStart);
        Object[] periodData = (Object[]) qPeriodSales.getSingleResult();
        r.setPeriodSalesCount(((Number) periodData[0]).longValue());
        r.setPeriodSalesTotal(toLong(periodData[1]));

        Query qPeriodRevenue = em.createNativeQuery(
            "SELECT COALESCE(SUM(monto_total), 0) FROM payments WHERE estado = 'Pagado' AND fecha >= ?1");
        qPeriodRevenue.setParameter(1, periodStart);
        r.setPeriodRevenue(toLong(qPeriodRevenue.getSingleResult()));

        List<Sale> allSales = saleRepository.findAll();
        Map<String, List<Sale>> byMonth = allSales.stream()
            .collect(Collectors.groupingBy(s -> extractMonth(s.getFecha())));
        r.setSalesByMonth(byMonth.entrySet().stream()
            .sorted((a, b) -> b.getKey().compareTo(a.getKey()))
            .limit(12)
            .map(e -> mapOf(
                "month", e.getKey(),
                "count", (long) e.getValue().size(),
                "total", e.getValue().stream().mapToLong(s -> s.getPrecio() != null ? s.getPrecio() : 0L).sum()))
            .toList());

        Query qTopProducts = em.createNativeQuery(
            "SELECT producto, COUNT(*) AS cnt FROM sales GROUP BY producto ORDER BY cnt DESC LIMIT 5");
        List<Object[]> topRows = qTopProducts.getResultList();
        r.setTopProducts(topRows.stream()
            .map(row -> mapOf("producto", String.valueOf(row[0]), "count", ((Number)row[1]).longValue()))
            .toList());

        Map<String, Long> aging = new LinkedHashMap<>();
        aging.put("d0_30", getAgingTotal(0, 30));
        aging.put("d31_60", getAgingTotal(31, 60));
        aging.put("d61_90", getAgingTotal(61, 90));
        aging.put("d90plus", getAgingTotal(91, 9999));
        r.setAgingBuckets(aging);

        Query qPendingSales = em.createNativeQuery(
            "SELECT id, cliente, precio, COALESCE(pago_inicial, 0) as pagado, (precio - COALESCE(pago_inicial, 0)) as saldo FROM sales WHERE estado_pago != 'Pagado' ORDER BY fecha ASC LIMIT 20");
        List<Object[]> pendingRows = qPendingSales.getResultList();
        r.setPendingSales(pendingRows.stream()
            .map(row -> mapOf(
                "id", String.valueOf(row[0]),
                "cliente", String.valueOf(row[1]),
                "total", row[2],
                "pagado", row[3],
                "saldo", row[4]))
            .toList());

        return r;
    }

    private long getAgingTotal(int minDays, int maxDays) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(maxDays);
        LocalDate endDate = today.minusDays(minDays);

        Query q = em.createNativeQuery(
            "SELECT COALESCE(SUM(s.precio - COALESCE(s.pago_inicial, 0) - COALESCE(p.pagado, 0)), 0) " +
            "FROM sales s LEFT JOIN (SELECT pi.venta_id, SUM(pi.monto_asignado) as pagado FROM payment_items pi GROUP BY pi.venta_id) p ON s.id = p.venta_id " +
            "WHERE s.estado_pago != 'Pagado' AND s.fecha BETWEEN ?1 AND ?2");
        q.setParameter(1, startDate);
        q.setParameter(2, endDate);
        return toLong(q.getSingleResult());
    }

    private LocalDate calcPeriodStart(String period) {
        LocalDate now = LocalDate.now();
        return switch (period != null ? period : "month") {
            case "year" -> now.withDayOfYear(1);
            case "quarter" -> now.minusMonths(3);
            default -> now.withDayOfMonth(1);
        };
    }

    private Long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number n) return n.longValue();
        return 0L;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapOf(Object... entries) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < entries.length; i += 2) {
            map.put((String) entries[i], entries[i + 1]);
        }
        return map;
    }

    private String extractMonth(LocalDate fecha) {
        if (fecha == null) return "";
        return fecha.toString().substring(0, 7);
    }
}
