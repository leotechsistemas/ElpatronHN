package com.patron.erp.service;

import com.patron.erp.dto.request.ProductRequest;
import com.patron.erp.dto.response.PageResponse;
import com.patron.erp.dto.response.ProductResponse;
import com.patron.erp.model.Product;
import com.patron.erp.model.StockLog;
import com.patron.erp.repository.ProductRepository;
import com.patron.erp.repository.StockLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;

@Service
public class ProductService {

    private final ProductRepository repository;
    private final StockLogRepository stockLogRepository;

    public ProductService(ProductRepository repository, StockLogRepository stockLogRepository) {
        this.repository = repository;
        this.stockLogRepository = stockLogRepository;
    }

    public List<ProductResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public PageResponse<ProductResponse> findAll(int page, int size, String search, String categoria) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "nombre"));
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank())
                predicates.add(cb.like(cb.lower(root.get("nombre")), "%" + search.toLowerCase() + "%"));
            if (categoria != null && !categoria.isBlank() && !categoria.equals("todas"))
                predicates.add(cb.equal(root.get("categoria"), categoria));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Product> productPage = repository.findAll(spec, pageable);
        return new PageResponse<>(
            productPage.getContent().stream().map(this::toResponse).toList(),
            productPage.getTotalElements(), productPage.getTotalPages(), productPage.getNumber(), productPage.getSize()
        );
    }

    public ProductResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    public ProductResponse create(ProductRequest req) {
        Product p = new Product();
        p.setId(generateId());
        applyRequest(p, req);
        return toResponse(repository.save(p));
    }

    public ProductResponse update(String id, ProductRequest req) {
        Product p = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        applyRequest(p, req);
        return toResponse(repository.save(p));
    }

    public void delete(String id) {
        if (!repository.existsById(id)) throw new RuntimeException("Producto no encontrado");
        repository.deleteById(id);
    }

    @Transactional
    public void deductStock(String productId, int cantidad, String referencia, String usuario) {
        Product p = repository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productId));
        if (p.getStockActual() < cantidad) {
            throw new RuntimeException("Stock insuficiente para " + p.getNombre()
                    + ": disponible " + p.getStockActual() + ", requerido " + cantidad);
        }
        p.setStockActual(p.getStockActual() - cantidad);
        p.setSalidas(p.getSalidas() != null ? p.getSalidas() + cantidad : cantidad);
        repository.save(p);

        StockLog log = new StockLog();
        log.setId("MOV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        log.setProductoId(productId);
        log.setProducto(p.getNombre());
        log.setFecha(LocalDate.now());
        log.setTipo("salida");
        log.setCantidad(cantidad);
        log.setCostoUnitario(p.getPrecioCosto());
        log.setCostoTotal(p.getPrecioCosto() * cantidad);
        log.setReferencia(referencia);
        log.setUsuario(usuario);
        stockLogRepository.save(log);
    }

    @Transactional
    public void addStock(String productId, int cantidad, Long costoUnitario, String referencia, String usuario) {
        Product p = repository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productId));
        p.setStockActual(p.getStockActual() + cantidad);
        p.setEntradas(p.getEntradas() != null ? p.getEntradas() + cantidad : cantidad);
        if (costoUnitario != null) {
            p.setPrecioCosto(costoUnitario);
        }
        repository.save(p);

        StockLog log = new StockLog();
        log.setId("MOV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        log.setProductoId(productId);
        log.setProducto(p.getNombre());
        log.setFecha(LocalDate.now());
        log.setTipo("entrada");
        log.setCantidad(cantidad);
        log.setCostoUnitario(costoUnitario);
        log.setCostoTotal(costoUnitario != null ? costoUnitario * cantidad : null);
        log.setReferencia(referencia);
        log.setUsuario(usuario);
        stockLogRepository.save(log);
    }

    private void applyRequest(Product p, ProductRequest req) {
        p.setCodigo(req.getCodigo());
        p.setNombre(req.getNombre());
        p.setCategoria(req.getCategoria());
        p.setStockInicial(req.getStockInicial() != null ? req.getStockInicial() : 0);
        p.setStockActual(req.getStockActual() != null ? req.getStockActual() : (req.getStockInicial() != null ? req.getStockInicial() : 0));
        p.setAlertaStock(req.getAlertaStock() != null ? req.getAlertaStock() : 0);
        p.setPrecioCosto(req.getPrecioCosto());
        p.setPrecioVenta(req.getPrecioVenta());
        p.setObservaciones(req.getObservaciones());
        p.setMaterial(req.getMaterial());
        String pid = req.getProveedorId();
        p.setProveedorId(pid != null && !pid.isBlank() ? pid : null);
    }

    private String generateId() { return "PRD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }

    private ProductResponse toResponse(Product p) {
        ProductResponse r = new ProductResponse();
        r.setId(p.getId()); r.setCodigo(p.getCodigo()); r.setNombre(p.getNombre()); r.setCategoria(p.getCategoria());
        r.setStockInicial(p.getStockInicial()); r.setEntradas(p.getEntradas()); r.setSalidas(p.getSalidas());
        r.setStockActual(p.getStockActual()); r.setPrecioCosto(p.getPrecioCosto()); r.setPrecioVenta(p.getPrecioVenta());
        r.setObservaciones(p.getObservaciones()); r.setMaterial(p.getMaterial());
        r.setProveedorId(p.getProveedorId()); r.setAlertaStock(p.getAlertaStock());
        return r;
    }
}
