package com.patron.erp.service;
import com.patron.erp.util.DateUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.patron.erp.dto.request.SaleCompleteRequest;
import com.patron.erp.dto.request.SaleRequest;
import com.patron.erp.dto.response.*;
import com.patron.erp.model.*;
import com.patron.erp.repository.*;
import com.patron.erp.dto.request.PaymentCreateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.persistence.criteria.Predicate;

@Service
public class SaleService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SaleService.class);

    private final SaleRepository repository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentItemRepository paymentItemRepository;
    private final ProductService productService;
    private final ClientService clientService;
    private final QuotationRepository quotationRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final AccountingService accountingService;
    private final ProductRepository productRepository;

    public SaleService(SaleRepository repository,
                       InvoiceItemRepository invoiceItemRepository,
                       ProductionTaskRepository productionTaskRepository,
                       PaymentRepository paymentRepository,
                       PaymentItemRepository paymentItemRepository,
                       ProductService productService,
                       ClientService clientService,
                       QuotationRepository quotationRepository,
                       ServiceTypeRepository serviceTypeRepository,
                       AccountingService accountingService,
                       ProductRepository productRepository) {
        this.repository = repository;
        this.invoiceItemRepository = invoiceItemRepository;
        this.productionTaskRepository = productionTaskRepository;
        this.paymentRepository = paymentRepository;
        this.paymentItemRepository = paymentItemRepository;
        this.productService = productService;
        this.clientService = clientService;
        this.quotationRepository = quotationRepository;
        this.serviceTypeRepository = serviceTypeRepository;
        this.accountingService = accountingService;
        this.productRepository = productRepository;
    }

    public List<SaleResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public PageResponse<SaleResponse> findAll(int page, int size, String search, String estado, String estadoPago, String clienteId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fecha"));
        Specification<Sale> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank())
                predicates.add(cb.like(cb.lower(root.get("cliente")), "%" + search.toLowerCase() + "%"));
            if (estado != null && !estado.isBlank() && !estado.equals("todas"))
                predicates.add(cb.equal(root.get("estado"), estado));
            if (estadoPago != null && !estadoPago.isBlank() && !estadoPago.equals("todos"))
                predicates.add(cb.equal(root.get("estadoPago"), estadoPago));
            if (clienteId != null && !clienteId.isBlank())
                predicates.add(cb.equal(root.get("clienteId"), clienteId));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Sale> salePage = repository.findAll(spec, pageable);
        return new PageResponse<>(
            salePage.getContent().stream().map(this::toResponse).toList(),
            salePage.getTotalElements(), salePage.getTotalPages(), salePage.getNumber(), salePage.getSize()
        );
    }

    public SaleResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
    }

    @Transactional
    public SaleCompleteResponse createComplete(SaleCompleteRequest req) {
        // First pass: calculate total and collect summary info
        long precioTotal = 0L;
        int productCount = 0;
        int serviceCount = 0;
        String firstProductName = "";
        String firstServiceDesc = "";

        if (req.getItems() != null) {
            for (SaleCompleteRequest.InvoiceItemData itemData : req.getItems()) {
                long cantidad = itemData.getCantidad() != null ? itemData.getCantidad() : 1L;
                long descuento = itemData.getDescuento() != null ? itemData.getDescuento() : 0L;
                long precioUnitario = itemData.getPrecioUnitario() != null ? itemData.getPrecioUnitario() : 0L;

                if ("PRODUCTO".equals(itemData.getTipoItem()) && itemData.getProductoId() != null) {
                    Product product = productRepository.findById(itemData.getProductoId())
                            .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + itemData.getProductoId()));
                    precioUnitario = product.getPrecioVenta();
                    itemData.setPrecioUnitario(precioUnitario);
                }

                long subtotal = cantidad * precioUnitario - descuento;
                if (subtotal < 0) subtotal = 0L;
                int isv = itemData.getIsv() != null ? itemData.getIsv() : 15;
                long impuesto = subtotal * isv / 100;
                long totalLinea = subtotal + impuesto;
                precioTotal = precioTotal + totalLinea;

                if ("PRODUCTO".equals(itemData.getTipoItem())) {
                    productCount++;
                    if (firstProductName.isEmpty()) firstProductName = itemData.getDescripcion();
                } else {
                    serviceCount++;
                    if (firstServiceDesc.isEmpty()) firstServiceDesc = itemData.getDescripcion();
                }
            }
        }

        // Create sale
        Sale s = new Sale();
        s.setId(generateId());
        s.setFecha(LocalDate.now());
        s.setClienteId(req.getClienteId());
        s.setCliente(req.getCliente());
        s.setRtn(req.getRtn());
        s.setConRtn(req.getConRtn() != null ? req.getConRtn() : true);
        s.setPrecio(precioTotal);
        s.setPagoInicial(req.getPagoInicial() != null ? req.getPagoInicial().getMonto() : 0L);
        s.setEstado("Pendiente");
        s.setEstadoPago("Pendiente");
        s.setObservaciones(req.getObservaciones());
        s.setVendedorId(req.getVendedorId());

        if (firstProductName.isEmpty() && !firstServiceDesc.isEmpty()) {
            s.setProducto(firstServiceDesc);
        } else {
            s.setProducto(firstProductName);
        }
        StringBuilder tipoResumen = new StringBuilder();
        if (productCount > 0) tipoResumen.append(productCount).append(" producto(s)");
        if (serviceCount > 0) {
            if (tipoResumen.length() > 0) tipoResumen.append(" · ");
            tipoResumen.append(serviceCount).append(" servicio(s)");
        }
        s.setTipoTrabajo(tipoResumen.length() > 0 ? tipoResumen.toString() : "Multi-item");

        s = repository.saveAndFlush(s);

        // Second pass: create invoice items, production tasks, deduct stock
        List<InvoiceItem> items = new ArrayList<>();
        List<ProductionTask> tasks = new ArrayList<>();

        if (req.getItems() != null) {
            for (SaleCompleteRequest.InvoiceItemData itemData : req.getItems()) {
                InvoiceItem item = new InvoiceItem();
                item.setId("INV-ITM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                item.setVentaId(s.getId());
                item.setTipoItem(itemData.getTipoItem());
                item.setProductoId(itemData.getProductoId());
                item.setServicioId(itemData.getServicioId());
                item.setDescripcion(itemData.getDescripcion());
                item.setCantidad(itemData.getCantidad() != null ? itemData.getCantidad() : 1L);
                item.setPrecioUnitario(itemData.getPrecioUnitario());
                item.setDescuento(itemData.getDescuento() != null ? itemData.getDescuento() : 0L);
                item.setIsv(itemData.getIsv() != null ? itemData.getIsv() : 15);

                long subtotal = item.getCantidad() * item.getPrecioUnitario() - item.getDescuento();
                if (subtotal < 0) subtotal = 0L;
                item.setSubtotal(subtotal);
                long impuesto = subtotal * item.getIsv() / 100;
                long totalLinea = subtotal + impuesto;
                item.setTotalLinea(totalLinea);

                items.add(invoiceItemRepository.save(item));

                if ("PRODUCTO".equals(itemData.getTipoItem()) && itemData.getProductoId() != null) {
                    productService.deductStock(itemData.getProductoId(),
                            itemData.getCantidad().intValue(),
                            "Venta " + s.getId(),
                            req.getVendedorId());
                }

                if ("SERVICIO".equals(itemData.getTipoItem())) {
                    ProductionTask task = new ProductionTask();
                    task.setId(UUID.randomUUID().toString().substring(0, 8));
                    task.setVentaId(s.getId());
                    task.setClienteId(req.getClienteId());
                    task.setCliente(req.getCliente());
                    task.setDescripcion(itemData.getDescripcion());
                    String tipoTrabajo = "Servicio";
                    if (itemData.getServicioId() != null) {
                        tipoTrabajo = serviceTypeRepository.findById(itemData.getServicioId())
                                .map(ServiceType::getNombre)
                                .orElse("Servicio");
                    }
                    task.setTipo(tipoTrabajo);
                    task.setEstado("Pendiente");
                    task.setCreadoEn(LocalDateTime.now());
                    task.setVendedorId(req.getVendedorId());
                    tasks.add(productionTaskRepository.save(task));
                }
            }
        }

        // Handle initial payment
        String paymentId = null;
        System.err.println("=== DEBUG createComplete ===");
        System.err.println("precioTotal = " + precioTotal);
        System.err.println("pagoInicial.monto (raw) = " + (req.getPagoInicial() != null ? req.getPagoInicial().getMonto() : "N/A"));
        System.err.println("pagoInicial >= precioTotal? = " + (req.getPagoInicial() != null && req.getPagoInicial().getMonto() >= precioTotal));
        if (req.getItems() != null) {
            for (var it : req.getItems()) {
                System.err.println("  item: precioUnitario=" + it.getPrecioUnitario() + " cantidad=" + it.getCantidad() + " descuento=" + it.getDescuento() + " isv=" + it.getIsv());
            }
        }
        if (req.getPagoInicial() != null && req.getPagoInicial().getMonto() > 0L) {
            paymentId = "PAG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            Payment payment = new Payment();
            payment.setId(paymentId);
            payment.setClienteId(req.getClienteId());
            payment.setCliente(req.getCliente());
            payment.setFecha(LocalDate.now());
            payment.setMontoTotal(req.getPagoInicial().getMonto());
            payment.setMetodo(req.getPagoInicial().getMetodo());
            payment.setEstado("Pagado");
            payment.setObservaciones("Abono inicial.");
            payment.setRegistradoPor(req.getVendedorId());
            PaymentItem pi = new PaymentItem();
            pi.setPaymentId(paymentId);
            pi.setVentaId(s.getId());
            pi.setMontoAsignado(req.getPagoInicial().getMonto());
            payment.setItems(List.of(pi));
            paymentRepository.save(payment);

            s.setEstadoPago(req.getPagoInicial().getMonto() >= precioTotal ? "Pagado" : "Pendiente");

            clientService.updateLtv(req.getClienteId(), req.getPagoInicial().getMonto());
        }

        s = repository.save(s);

        try {
            accountingService.autoGenerateFromSale(s.getId(), s.getCliente(),
                precioTotal,
                req.getPagoInicial() != null ? req.getPagoInicial().getMonto() : 0L,
                req.getPagoInicial() != null ? req.getPagoInicial().getMetodo() : "",
                req.getVendedorId());
        } catch (Exception ex) {
            log.error("Error al generar asiento contable para venta {}: {}", s.getId(), ex.getMessage(), ex);
            throw new RuntimeException("Error en proceso contable (Venta): " + ex.getMessage(), ex);
        }

        try {
            accountingService.autoGenerateCostOfSale(s.getId(), req.getVendedorId());
        } catch (Exception ex) {
            log.error("Error al generar asiento de costo de venta para venta {}: {}", s.getId(), ex.getMessage(), ex);
            throw new RuntimeException("Error en proceso contable (Costo de Venta): " + ex.getMessage(), ex);
        }

        SaleCompleteResponse response = new SaleCompleteResponse();
        response.setSale(toResponse(s));
        response.setItems(items.stream().map(this::toItemResponse).collect(Collectors.toList()));
        response.setProductionTasks(tasks.stream().map(this::toTaskResponse).collect(Collectors.toList()));
        if (paymentId != null) {
            Payment savedPayment = paymentRepository.findById(paymentId).orElse(null);
            response.setPayment(toPaymentResponse(savedPayment));
        }
        return response;
    }

    @Transactional
    public SaleResponse recalcStatus(String id) {
        Sale s = repository.findById(id).orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        // Derive estado from production tasks
        List<ProductionTask> tasks = productionTaskRepository.findByVentaId(id);
        if (tasks.isEmpty()) {
            s.setEstado("Pendiente");
        } else if (tasks.stream().allMatch(t -> "Completada".equals(t.getEstado()))) {
            s.setEstado("Terminado");
        } else if (tasks.stream().anyMatch(t -> "En Proceso".equals(t.getEstado()) || "En proceso".equals(t.getEstado()))) {
            s.setEstado("En proceso");
        } else {
            s.setEstado("Pendiente");
        }

        // Derive estadoPago from payment items
        List<PaymentItem> saleItems = paymentItemRepository.findByVentaId(id);
        long totalPaid = saleItems.stream()
                .mapToLong(PaymentItem::getMontoAsignado)
                .sum();

        if (totalPaid >= s.getPrecio()) {
            s.setEstadoPago("Pagado");
        } else if (totalPaid > 0L) {
            s.setEstadoPago("Pendiente");
        } else {
            s.setEstadoPago("Pendiente");
        }

        return toResponse(repository.save(s));
    }

    @Transactional
    public SaleCompleteResponse convertFromQuotation(String quoteId, Long pagoInicial, String metodoPago, String vendedorId) {
        Quotation q = quotationRepository.findById(quoteId)
                .orElseThrow(() -> new RuntimeException("Cotización no encontrada"));

        List<Map<String, Object>> items;
        try {
            ObjectMapper mapper = new ObjectMapper();
            items = mapper.readValue(q.getItems(), new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Error al parsear items de cotización: " + e.getMessage());
        }

        if (items.isEmpty()) throw new RuntimeException("La cotización no tiene trabajos");

        // Build SaleCompleteRequest from quotation
        SaleCompleteRequest req = new SaleCompleteRequest();
        req.setClienteId(q.getClienteId());
        req.setCliente(q.getCliente());
        req.setRtn(q.getRtn() != null ? q.getRtn() : "");
        req.setConRtn(q.getConRtn());
        req.setObservaciones("Convertido de Cotización " + q.getId() + " · " +
                items.stream().map(i -> String.valueOf(i.getOrDefault("tipoTrabajo", "")))
                     .collect(Collectors.joining(", ")));
        req.setVendedorId(vendedorId);

        List<SaleCompleteRequest.InvoiceItemData> saleItems = new ArrayList<>();
        for (Map<String, Object> itemData : items) {
            SaleCompleteRequest.InvoiceItemData i = new SaleCompleteRequest.InvoiceItemData();
            boolean isProduct = itemData.containsKey("productId") && itemData.get("productId") != null
                    && !String.valueOf(itemData.get("productId")).isEmpty();
            i.setTipoItem(isProduct ? "PRODUCTO" : "SERVICIO");
            i.setProductoId(isProduct ? String.valueOf(itemData.get("productId")) : null);
            if (!isProduct) {
                String servicioId = itemData.containsKey("serviceId") && itemData.get("serviceId") != null
                        ? String.valueOf(itemData.get("serviceId")) : null;
                if (servicioId == null || servicioId.isEmpty()) {
                    String tipoTrabajo = String.valueOf(itemData.getOrDefault("tipoTrabajo", ""));
                    servicioId = serviceTypeRepository.findByNombre(tipoTrabajo)
                            .map(ServiceType::getId)
                            .orElse("ST-0006");
                }
                i.setServicioId(servicioId);
            } else {
                i.setServicioId(null);
            }
            i.setDescripcion(String.valueOf(itemData.getOrDefault("descripcion", itemData.getOrDefault("tipoTrabajo", "Servicio"))));
            i.setCantidad(itemData.containsKey("cantidad") ? Long.valueOf(String.valueOf(itemData.get("cantidad"))) : 1L);
            i.setPrecioUnitario(itemData.containsKey("precio") ? Long.valueOf(String.valueOf(itemData.get("precio"))) : 0L);
            i.setDescuento(0L);
            i.setIsv(15);
            saleItems.add(i);
        }
        req.setItems(saleItems);

        if (pagoInicial != null && pagoInicial > 0L) {
            SaleCompleteRequest.InitialPaymentData pago = new SaleCompleteRequest.InitialPaymentData();
            pago.setMonto(pagoInicial);
            pago.setMetodo(metodoPago != null ? metodoPago : "Efectivo");
            req.setPagoInicial(pago);
        } else {
            req.setPagoInicial(null);
        }

        SaleCompleteResponse response = createComplete(req);

        // Mark quotation as converted
        q.setEstado("Convertido");
        quotationRepository.save(q);

        return response;
    }

    private InvoiceItemResponse toItemResponse(InvoiceItem item) {
        InvoiceItemResponse r = new InvoiceItemResponse();
        r.setId(item.getId()); r.setVentaId(item.getVentaId());
        r.setTipoItem(item.getTipoItem()); r.setProductoId(item.getProductoId());
        r.setServicioId(item.getServicioId()); r.setDescripcion(item.getDescripcion());
        r.setCantidad(item.getCantidad()); r.setPrecioUnitario(item.getPrecioUnitario());
        r.setDescuento(item.getDescuento()); r.setIsv(item.getIsv());
        r.setSubtotal(item.getSubtotal()); r.setTotalLinea(item.getTotalLinea());
        return r;
    }

    private ProductionTaskResponse toTaskResponse(ProductionTask t) {
        ProductionTaskResponse r = new ProductionTaskResponse();
        r.setId(t.getId()); r.setVentaId(t.getVentaId()); r.setClienteId(t.getClienteId());
        r.setCliente(t.getCliente()); r.setDescripcion(t.getDescripcion()); r.setTipo(t.getTipo());
        r.setEstado(t.getEstado());
        r.setCreadoEn(t.getCreadoEn() != null ? t.getCreadoEn().toString() : null);
        r.setInicioEn(t.getInicioEn() != null ? t.getInicioEn().toString() : null);
        r.setCompletadoEn(t.getCompletadoEn() != null ? t.getCompletadoEn().toString() : null);
        r.setVendedorId(t.getVendedorId());
        return r;
    }

    private PaymentResponse toPaymentResponse(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId()); r.setClienteId(p.getClienteId());
        r.setCliente(p.getCliente()); r.setFecha(p.getFecha() != null ? p.getFecha().toString() : null);
        r.setMontoTotal(p.getMontoTotal());
        r.setMetodo(p.getMetodo()); r.setEstado(p.getEstado()); r.setObservaciones(p.getObservaciones());
        r.setRegistradoPor(p.getRegistradoPor());
        r.setCreatedAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        r.setVentasCount(p.getItems() != null ? p.getItems().size() : 0);
        r.setItems(p.getItems() != null ? p.getItems().stream().map(item -> {
            PaymentItemResponse ir = new PaymentItemResponse();
            ir.setId(item.getId());
            ir.setVentaId(item.getVentaId());
            ir.setMontoAsignado(item.getMontoAsignado());
            return ir;
        }).toList() : List.of());
        return r;
    }

    public SaleResponse create(SaleRequest req) {
        Sale s = new Sale();
        s.setId(generateId());
        applyRequest(s, req);
        return toResponse(repository.save(s));
    }

    public SaleResponse update(String id, SaleRequest req) {
        Sale s = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        applyRequest(s, req);
        return toResponse(repository.save(s));
    }

    public SaleResponse patchStatus(String id, String estado) {
        Sale s = repository.findById(id).orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        if (estado != null && !estado.isEmpty()) s.setEstado(estado);
        return toResponse(repository.save(s));
    }

    public void delete(String id) {
        if (!repository.existsById(id)) throw new RuntimeException("Venta no encontrada");
        repository.deleteById(id);
    }

    private void applyRequest(Sale s, SaleRequest req) {
        s.setFecha(DateUtils.parseDate(req.getFecha())); s.setClienteId(req.getClienteId());
        s.setCliente(req.getCliente()); s.setRtn(req.getRtn()); s.setConRtn(req.getConRtn() != null ? req.getConRtn() : true);
        s.setProductoId(req.getProductoId() != null && !req.getProductoId().isBlank() ? req.getProductoId() : "");
        s.setProducto(req.getProducto() != null && !req.getProducto().isBlank() ? req.getProducto() : ""); s.setTipoTrabajo(req.getTipoTrabajo());
        s.setPrecio(req.getPrecio()); s.setEstado(req.getEstado());
        s.setPagoInicial(req.getPagoInicial() != null ? req.getPagoInicial() : 0L);
        s.setEstadoPago(req.getEstadoPago()); s.setObservaciones(req.getObservaciones());
        s.setVendedorId(req.getVendedorId());
    }

    private String generateId() { return "VNT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }

    private SaleResponse toResponse(Sale s) {
        SaleResponse r = new SaleResponse();
        r.setId(s.getId()); r.setFecha(s.getFecha() != null ? s.getFecha().toString() : null); r.setClienteId(s.getClienteId());
        r.setCliente(s.getCliente()); r.setRtn(s.getRtn()); r.setConRtn(s.getConRtn());
        r.setProductoId(s.getProductoId()); r.setProducto(s.getProducto());
        r.setTipoTrabajo(s.getTipoTrabajo()); r.setPrecio(s.getPrecio()); r.setEstado(s.getEstado());
        r.setPagoInicial(s.getPagoInicial()); r.setEstadoPago(s.getEstadoPago());
        r.setObservaciones(s.getObservaciones()); r.setVendedorId(s.getVendedorId());
        return r;
    }
}
