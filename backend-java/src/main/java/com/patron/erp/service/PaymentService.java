package com.patron.erp.service;
import com.patron.erp.util.DateUtils;

import com.patron.erp.dto.request.PaymentCreateRequest;
import com.patron.erp.dto.response.PageResponse;
import com.patron.erp.dto.response.PaymentItemResponse;
import com.patron.erp.dto.response.PaymentResponse;
import com.patron.erp.dto.response.SaleResponse;
import com.patron.erp.model.Payment;
import com.patron.erp.model.PaymentItem;
import com.patron.erp.model.Sale;
import com.patron.erp.repository.PaymentItemRepository;
import com.patron.erp.repository.PaymentRepository;
import com.patron.erp.repository.SaleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;

@Service
public class PaymentService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository repository;
    private final PaymentItemRepository itemRepository;
    private final SaleRepository saleRepository;
    private final ClientService clientService;
    private final AccountingService accountingService;

    public PaymentService(PaymentRepository repository, PaymentItemRepository itemRepository,
                          SaleRepository saleRepository, ClientService clientService,
                          AccountingService accountingService) {
        this.repository = repository;
        this.itemRepository = itemRepository;
        this.saleRepository = saleRepository;
        this.clientService = clientService;
        this.accountingService = accountingService;
    }

    public List<PaymentResponse> findAll() {
        return repository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse).toList();
    }

    public PageResponse<PaymentResponse> findAll(int page, int size, String search, String metodo, String estado) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fecha"));
        Specification<Payment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank())
                predicates.add(cb.like(cb.lower(root.get("cliente")), "%" + search.toLowerCase() + "%"));
            if (metodo != null && !metodo.isBlank() && !metodo.equals("todos"))
                predicates.add(cb.equal(root.get("metodo"), metodo));
            if (estado != null && !estado.isBlank() && !estado.equals("todos"))
                predicates.add(cb.equal(root.get("estado"), estado));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Payment> paymentPage = repository.findAll(spec, pageable);
        return new PageResponse<>(
            paymentPage.getContent().stream().map(this::toResponse).toList(),
            paymentPage.getTotalElements(), paymentPage.getTotalPages(), paymentPage.getNumber(), paymentPage.getSize()
        );
    }

    public PaymentResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado"));
    }

    public List<PaymentResponse> findByVenta(String ventaId) {
        List<PaymentItem> items = itemRepository.findByVentaId(ventaId);
        Set<String> paymentIds = items.stream().map(PaymentItem::getPaymentId).collect(Collectors.toSet());
        return repository.findAllById(paymentIds).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse).toList();
    }

    @Transactional
    public PaymentResponse createPayment(PaymentCreateRequest req) {
        Payment p = new Payment();
        String paymentId = "PAG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        p.setId(paymentId);
        p.setClienteId(req.getClienteId());
        p.setCliente(req.getCliente());
        p.setFecha(LocalDate.now());
        p.setMetodo(req.getMetodo());
        p.setEstado("Pagado");
        p.setObservaciones(req.getObservaciones() != null ? req.getObservaciones() : "");
        p.setRegistradoPor(req.getRegistradoPor());

        long total = 0L;
        List<PaymentItem> items = new ArrayList<>();
        for (PaymentCreateRequest.ItemRequest itemReq : req.getItems()) {
            if (itemReq.getMonto() == null || itemReq.getMonto() <= 0L) continue;
            PaymentItem item = new PaymentItem();
            item.setPaymentId(paymentId);
            item.setVentaId(itemReq.getVentaId());
            item.setMontoAsignado(itemReq.getMonto());
            items.add(item);
            total = total + itemReq.getMonto();
        }
        p.setMontoTotal(total);
        p.setItems(items);
        p = repository.save(p);

        // Recalculate estadoPago for each sale and update LTV
        long totalLtvAdd = 0L;
        for (PaymentItem item : items) {
            totalLtvAdd = totalLtvAdd + item.getMontoAsignado();
            Sale sale = saleRepository.findById(item.getVentaId())
                    .orElseThrow(() -> new RuntimeException("Venta no encontrada: " + item.getVentaId()));
            long totalPaid = calculateTotalPaidForSale(item.getVentaId());
            String estadoPago;
            if (totalPaid >= sale.getPrecio()) estadoPago = "Pagado";
            else if (totalPaid > 0L) estadoPago = "Pendiente";
            else estadoPago = "Pendiente";
            sale.setEstadoPago(estadoPago);
            saleRepository.save(sale);
        }
        clientService.updateLtv(req.getClienteId(), totalLtvAdd);

        try {
            for (PaymentItem pi : items) {
                Sale s = saleRepository.findById(pi.getVentaId()).orElse(null);
                accountingService.autoGenerateFromPayment(paymentId, pi.getVentaId(),
                    req.getCliente(), pi.getMontoAsignado(), req.getMetodo(), req.getRegistradoPor());
            }
        } catch (Exception ex) {
            log.error("Error al generar asiento contable para pago {}: {}", paymentId, ex.getMessage(), ex);
            throw new RuntimeException("Error en proceso contable (Pago): " + ex.getMessage(), ex);
        }

        return toResponse(p);
    }

    @Transactional
    public void anular(String id) {
        Payment p = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado"));

        if ("Anulado".equals(p.getEstado())) {
            throw new RuntimeException("El pago ya está anulado");
        }

        // Set estado to Anulado (soft-delete, keep items for history)
        p.setEstado("Anulado");
        repository.save(p);

        // Subtract LTV
        clientService.updateLtv(p.getClienteId(), -p.getMontoTotal());

        // Recalculate each affected sale's estadoPago (items still exist, but calculateTotalPaidForSale excludes anulados)
        var affectedSales = p.getItems().stream()
                .map(PaymentItem::getVentaId)
                .distinct()
                .toList();
        for (String ventaId : affectedSales) {
            Sale sale = saleRepository.findById(ventaId).orElse(null);
            if (sale == null) continue;
            long totalPaid = calculateTotalPaidForSale(ventaId);
            String estadoPago;
            if (totalPaid >= sale.getPrecio()) estadoPago = "Pagado";
            else if (totalPaid > 0L) estadoPago = "Pendiente";
            else estadoPago = "Pendiente";
            sale.setEstadoPago(estadoPago);
            saleRepository.save(sale);
        }

        // Revert accounting entry if exists
        try {
            accountingService.revertEntryByReference("PAGO", id, "Sistema");
        } catch (Exception ex) {
            log.error("Error al revertir asiento contable para pago {}: {}", id, ex.getMessage(), ex);
            throw new RuntimeException("Error en proceso contable (Reversión Pago): " + ex.getMessage(), ex);
        }
    }

    @Transactional
    public void delete(String id) {
        // Keep hard delete for emergencies but prefer anular()
        anular(id);
    }

    private long calculateTotalPaidForSale(String ventaId) {
        List<PaymentItem> allItems = itemRepository.findByVentaId(ventaId);
        Set<String> anuladoPaymentIds = allItems.stream()
                .map(PaymentItem::getPaymentId)
                .distinct()
                .filter(pid -> repository.findById(pid).map(p -> "Anulado".equals(p.getEstado())).orElse(false))
                .collect(Collectors.toSet());
        return allItems.stream()
                .filter(item -> !anuladoPaymentIds.contains(item.getPaymentId()))
                .mapToLong(PaymentItem::getMontoAsignado)
                .sum();
    }

    private PaymentResponse toResponse(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId());
        r.setClienteId(p.getClienteId());
        r.setCliente(p.getCliente());
        r.setFecha(p.getFecha() != null ? p.getFecha().toString() : null);
        r.setMontoTotal(p.getMontoTotal());
        r.setMetodo(p.getMetodo());
        r.setEstado(p.getEstado());
        r.setObservaciones(p.getObservaciones());
        r.setRegistradoPor(p.getRegistradoPor());
        r.setCreatedAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        r.setVentasCount(p.getItems() != null ? p.getItems().size() : 0);
        r.setItems(p.getItems() != null ? p.getItems().stream().map(this::toItemResponse).toList() : List.of());
        return r;
    }

    private PaymentItemResponse toItemResponse(PaymentItem item) {
        PaymentItemResponse r = new PaymentItemResponse();
        r.setId(item.getId());
        r.setVentaId(item.getVentaId());
        r.setMontoAsignado(item.getMontoAsignado());
        Sale s = saleRepository.findById(item.getVentaId()).orElse(null);
        r.setProducto(s != null ? s.getProducto() : null);
        return r;
    }
}
