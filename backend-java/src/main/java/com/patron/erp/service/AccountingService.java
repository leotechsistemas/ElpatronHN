package com.patron.erp.service;
import com.patron.erp.util.DateUtils;
import com.patron.erp.util.MonetaryUtil;

import com.patron.erp.dto.request.AccountCatalogRequest;
import com.patron.erp.dto.request.AccountingEntryRequest;
import com.patron.erp.dto.response.*;
import com.patron.erp.model.*;
import com.patron.erp.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AccountingService {

    private final AccountCatalogRepository catalogRepository;
    private final AccountingEntryRepository entryRepository;
    private final AccountingEntryItemRepository itemRepository;
    private final PeriodoContableRepository periodoRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final ProductRepository productRepository;
    private final CompanySettingsRepository settingsRepository;

    public AccountingService(AccountCatalogRepository catalogRepository,
                              AccountingEntryRepository entryRepository,
                              AccountingEntryItemRepository itemRepository,
                              PeriodoContableRepository periodoRepository,
                              InvoiceItemRepository invoiceItemRepository,
                              ProductRepository productRepository,
                              CompanySettingsRepository settingsRepository) {
        this.catalogRepository = catalogRepository;
        this.entryRepository = entryRepository;
        this.itemRepository = itemRepository;
        this.periodoRepository = periodoRepository;
        this.invoiceItemRepository = invoiceItemRepository;
        this.productRepository = productRepository;
        this.settingsRepository = settingsRepository;
    }

    // ── Catálogo de Cuentas ──

    public List<AccountCatalogResponse> getCatalog() {
        List<AccountCatalog> all = catalogRepository.findByOrderByCodigoAsc();
        return all.stream().map(this::toCatalogResponse).toList();
    }

    public AccountCatalogResponse createAccount(AccountCatalogRequest req) {
        if (catalogRepository.findById(req.getCodigo()).isPresent())
            throw new RuntimeException("El código " + req.getCodigo() + " ya existe");

        AccountCatalog a = new AccountCatalog();
        a.setId(req.getCodigo());
        a.setCodigo(req.getCodigo());
        a.setNombre(req.getNombre());
        a.setTipo(req.getTipo());
        a.setNivel(req.getNivel());
        a.setPadreId(req.getPadreId());
        a.setAceptaAsientos(req.getAceptaAsientos() != null ? req.getAceptaAsientos() : true);
        a.setActivo(true);
        return toCatalogResponse(catalogRepository.save(a));
    }

    public AccountCatalogResponse updateAccount(String id, AccountCatalogRequest req) {
        AccountCatalog a = catalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));
        a.setNombre(req.getNombre());
        a.setTipo(req.getTipo());
        a.setNivel(req.getNivel());
        a.setPadreId(req.getPadreId());
        a.setAceptaAsientos(req.getAceptaAsientos() != null ? req.getAceptaAsientos() : a.getAceptaAsientos());
        return toCatalogResponse(catalogRepository.save(a));
    }

    public void toggleAccount(String id) {
        AccountCatalog a = catalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));
        a.setActivo(!a.getActivo());
        catalogRepository.save(a);
    }

    // ── Asientos Contables ──

    public List<AccountingEntryResponse> getEntries() {
        return entryRepository.findAll(Sort.by(Sort.Direction.DESC, "fecha")).stream()
                .map(this::toEntryResponse).toList();
    }

    public PageResponse<AccountingEntryResponse> getEntries(int page, int size, String search, String tipo) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fecha"));
        Specification<AccountingEntry> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank())
                predicates.add(cb.like(cb.lower(root.get("concepto")), "%" + search.toLowerCase() + "%"));
            if (tipo != null && !tipo.isBlank() && !tipo.equals("todos"))
                predicates.add(cb.equal(root.get("tipo"), tipo));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<AccountingEntry> entryPage = entryRepository.findAll(spec, pageable);
        return new PageResponse<>(
            entryPage.getContent().stream().map(this::toEntryResponse).toList(),
            entryPage.getTotalElements(), entryPage.getTotalPages(), entryPage.getNumber(), entryPage.getSize()
        );
    }

    public AccountingEntryResponse getEntry(String id) {
        return entryRepository.findById(id).map(this::toEntryResponse)
                .orElseThrow(() -> new RuntimeException("Asiento no encontrado"));
    }

    @Transactional
    public AccountingEntryResponse createEntry(AccountingEntryRequest req) {
        LocalDate fecha = DateUtils.parseDate(req.getFecha());

        if (fecha.isAfter(LocalDate.now()))
            throw new RuntimeException("La fecha del asiento no puede ser futura");

        PeriodoContable periodo = periodoRepository.findPeriodoForDate(fecha)
                .orElseThrow(() -> new RuntimeException("No hay período contable abierto para la fecha " + fecha));

        if (periodo.getCerrado())
            throw new RuntimeException("El período " + periodo.getCodigo() + " está cerrado. No se pueden crear asientos.");

        List<AccountingEntryRequest.EntryItem> reqItems = req.getItems();
        if (reqItems == null || reqItems.isEmpty())
            throw new RuntimeException("El asiento debe tener al menos un item");

        long totalDebe = 0L;
        long totalHaber = 0L;
        Set<String> cuentaIds = new HashSet<>();
        for (AccountingEntryRequest.EntryItem i : reqItems) {
            totalDebe += (i.getDebe() != null ? i.getDebe() : 0L);
            totalHaber += (i.getHaber() != null ? i.getHaber() : 0L);
            if (i.getCuentaId() != null) cuentaIds.add(i.getCuentaId());
        }

        for (String cuentaId : cuentaIds) {
            AccountCatalog cat = catalogRepository.findById(cuentaId)
                    .orElseThrow(() -> new RuntimeException("Cuenta " + cuentaId + " no existe en el catálogo"));
            if (!cat.getActivo())
                throw new RuntimeException("La cuenta " + cat.getCodigo() + " (" + cat.getNombre() + ") está inactiva");
            if (!cat.getAceptaAsientos())
                throw new RuntimeException("La cuenta " + cat.getCodigo() + " (" + cat.getNombre() + ") es de agrupación y no acepta asientos");
        }

        if (totalDebe != totalHaber)
            throw new RuntimeException("El asiento no cuadra: Debe (" + totalDebe + ") ≠ Haber (" + totalHaber + ")");

        AccountingEntry e = new AccountingEntry();
        String entryId = "AS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        e.setId(entryId);
        e.setNumeroAsiento(generateNumeroAsiento(fecha));
        e.setFecha(fecha);
        e.setConcepto(req.getConcepto());
        e.setTipo(req.getTipo());
        e.setReferenciaTipo(req.getReferenciaTipo());
        e.setReferenciaId(req.getReferenciaId());
        e.setCreadoPor(req.getCreadoPor());
        e.setTotalDebe(totalDebe);
        e.setTotalHaber(totalHaber);
        e.setReversado(false);
        e.setPeriodoId(periodo.getId());
        e = entryRepository.save(e);

        for (AccountingEntryRequest.EntryItem i : reqItems) {
            AccountingEntryItem item = new AccountingEntryItem();
            item.setAsientoId(entryId);
            item.setCuentaId(i.getCuentaId());
            item.setDebe(i.getDebe() != null ? i.getDebe() : 0L);
            item.setHaber(i.getHaber() != null ? i.getHaber() : 0L);
            item.setGlosa(i.getGlosa());
            itemRepository.save(item);
        }

        return getEntry(entryId);
    }

    private String generateNumeroAsiento(LocalDate fecha) {
        String prefix = "AS-" + fecha.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        int last = entryRepository.findLastCorrelativeByPrefix(prefix);
        return prefix + "-" + String.format("%04d", last + 1);
    }

    @Transactional
    public AccountingEntryResponse revertEntry(String id, String usuario) {
        AccountingEntry original = entryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asiento no encontrado"));

        if (original.getReversado())
            throw new RuntimeException("El asiento " + original.getNumeroAsiento() + " ya fue reversado");

        List<AccountingEntryItem> originalItems = itemRepository.findByAsientoId(id);

        AccountingEntryRequest req = new AccountingEntryRequest();
        req.setFecha(LocalDate.now().toString());
        req.setConcepto("Reversión de " + original.getNumeroAsiento() + " - " + original.getConcepto());
        req.setTipo(original.getTipo());
        req.setReferenciaTipo("REVERSIÓN");
        req.setReferenciaId(original.getId());
        req.setCreadoPor(usuario);

        List<AccountingEntryRequest.EntryItem> items = new ArrayList<>();
        for (AccountingEntryItem item : originalItems) {
            AccountingEntryRequest.EntryItem ei = new AccountingEntryRequest.EntryItem();
            ei.setCuentaId(item.getCuentaId());
            ei.setDebe(item.getHaber());
            ei.setHaber(item.getDebe());
            ei.setGlosa("Reversión: " + (item.getGlosa() != null ? item.getGlosa() : ""));
            items.add(ei);
        }
        req.setItems(items);

        AccountingEntryResponse response = createEntry(req);

        original.setReversado(true);
        entryRepository.save(original);

        return response;
    }

    @Transactional
    public void revertEntryByReference(String referenciaTipo, String referenciaId, String usuario) {
        List<AccountingEntry> entries = entryRepository.findByReferenciaTipoAndReferenciaId(referenciaTipo, referenciaId);
        for (AccountingEntry entry : entries) {
            if (!entry.getReversado()) {
                revertEntry(entry.getId(), usuario);
            }
        }
    }

    @Transactional
    public void deleteEntry(String id) {
        throw new RuntimeException("No se permite eliminar asientos directamente. Use reversión en su lugar.");
    }

    // ── Generación automática ──

    @Transactional
    public void autoGenerateFromSale(String ventaId, String clienteNombre, Long total,
                                      Long pagoInicial, String metodoPago, String creadoPor) {
        String concepto = "Venta " + ventaId + " - " + clienteNombre;
        String cuentaVentas = findCuentaByCodigo("4.1.1");
        String cuentaCaja = findCuentaByCodigo("1.1.1");
        String cuentaBancos = findCuentaByCodigo("1.1.2");
        String cuentaCxC = findCuentaByCodigo("1.1.3");
        String cuentaImpuestos = findCuentaByCodigo("2.1.1");

        int isvRate = getIsvRate();
        List<InvoiceItem> invoiceItems = invoiceItemRepository.findByVentaIdOrderByTipoItem(ventaId);

        long subtotalTotal = 0L;
        long isvTotal = 0L;

        if (!invoiceItems.isEmpty()) {
            for (InvoiceItem item : invoiceItems) {
                subtotalTotal += item.getSubtotal();
                long impuesto = item.getSubtotal() * item.getIsv() / 100;
                isvTotal += impuesto;
            }
        } else {
            // total = subtotal + (subtotal * isvRate / 100) = subtotal * (100 + isvRate) / 100
            // subtotal = total * 100 / (100 + isvRate)
            subtotalTotal = total * 100 / (100 + isvRate);
            isvTotal = total - subtotalTotal;
        }

        List<AccountingEntryRequest.EntryItem> items = new ArrayList<>();

        long totalConIsv = subtotalTotal + isvTotal;

        if (pagoInicial != null && pagoInicial > 0L) {
            String cuentaDebito;
            if ("Tarjeta".equals(metodoPago) || "Transferencia".equals(metodoPago)) {
                cuentaDebito = cuentaBancos;
            } else {
                cuentaDebito = cuentaCaja;
            }

            if (pagoInicial >= totalConIsv) {
                items.add(entryItem(cuentaDebito, totalConIsv, 0L, "Pago contado"));
            } else {
                items.add(entryItem(cuentaDebito, pagoInicial, 0L, "Pago inicial"));
                items.add(entryItem(cuentaCxC, totalConIsv - pagoInicial, 0L, "Saldo por cobrar"));
            }
        } else {
            items.add(entryItem(cuentaCxC, totalConIsv, 0L, "Venta a crédito"));
        }

        items.add(entryItem(cuentaVentas, 0L, subtotalTotal, "Venta"));
        items.add(entryItem(cuentaImpuestos, 0L, isvTotal, "ISV"));

        createAutoEntry(LocalDate.now(), concepto, "Ingreso", "VENTA", ventaId, creadoPor, items);
    }

    @Transactional
    public void autoGenerateCostOfSale(String ventaId, String creadoPor) {
        List<InvoiceItem> invoiceItems = invoiceItemRepository.findByVentaIdOrderByTipoItem(ventaId);
        if (invoiceItems.isEmpty()) return;

        String cuentaCosto = findCuentaByCodigo("5.1.1");
        String cuentaInventario = findCuentaByCodigo("1.1.4");

        long costoTotal = 0L;
        for (InvoiceItem item : invoiceItems) {
            if (!"PRODUCTO".equals(item.getTipoItem()) || item.getProductoId() == null) continue;
            Product product = productRepository.findById(item.getProductoId()).orElse(null);
            if (product == null || product.getPrecioCosto() == null) continue;
            long costoLinea = product.getPrecioCosto() * item.getCantidad();
            costoTotal += costoLinea;
        }

        if (costoTotal <= 0L) return;

        String concepto = "Costo de Venta " + ventaId;
        List<AccountingEntryRequest.EntryItem> items = new ArrayList<>();
        items.add(entryItem(cuentaCosto, costoTotal, 0L, "Costo de venta"));
        items.add(entryItem(cuentaInventario, 0L, costoTotal, "Salida de inventario"));

        createAutoEntry(LocalDate.now(), concepto, "Diario", "COSTO", ventaId, creadoPor, items);
    }

    @Transactional
    public void autoGenerateFromPayment(String paymentId, String ventaId, String clienteNombre,
                                         Long monto, String metodo, String creadoPor) {
        String concepto = "Pago " + paymentId + " - " + clienteNombre + " (Venta " + ventaId + ")";
        String cuentaDebito;
        if ("Tarjeta".equals(metodo) || "Transferencia".equals(metodo)) {
            cuentaDebito = findCuentaByCodigo("1.1.2");
        } else {
            cuentaDebito = findCuentaByCodigo("1.1.1");
        }
        String cuentaCxC = findCuentaByCodigo("1.1.3");

        List<AccountingEntryRequest.EntryItem> items = new ArrayList<>();
        items.add(entryItem(cuentaDebito, monto, 0L, "Cobro"));
        items.add(entryItem(cuentaCxC, 0L, monto, "Cancelación saldo"));

        createAutoEntry(LocalDate.now(), concepto, "Ingreso", "PAGO", paymentId, creadoPor, items);
    }

    @Transactional
    public void initOpeningEntry(String creadoPor) {
        boolean hasEntries = entryRepository.count() > 0;
        if (hasEntries) return;

        String capitalStr = "100000.00";
        String concepto = "Apertura del sistema - Aporte de capital inicial";

        String cuentaCaja = findCuentaByCodigo("1.1.1");
        String cuentaCapital = findCuentaByCodigo("3.1.1");

        long capital = MonetaryUtil.toCents(Double.parseDouble(capitalStr));

        List<AccountingEntryRequest.EntryItem> items = new ArrayList<>();
        items.add(entryItem(cuentaCaja, capital, 0L, "Aporte de capital"));
        items.add(entryItem(cuentaCapital, 0L, capital, "Capital inicial"));

        createAutoEntry(LocalDate.of(2023, 1, 1), concepto, "Diario", "APERTURA", "SISTEMA", creadoPor, items);
    }

    @Transactional
    public void closePeriod(String periodoCodigo, String usuario) {
        PeriodoContable periodo = periodoRepository.findByCodigo(periodoCodigo)
                .orElseThrow(() -> new RuntimeException("Período " + periodoCodigo + " no encontrado"));

        if (periodo.getCerrado())
            throw new RuntimeException("El período " + periodoCodigo + " ya está cerrado");

        IncomeStatementResponse income = getIncomeStatement(periodo);
        Long utilidad = income.getResultadoNeto();

        String cuentaIngresos = findCuentaByCodigo("4");
        String cuentaGastos = findCuentaByCodigo("5");
        String cuentaUtilidad;
        if (utilidad >= 0L) {
            cuentaUtilidad = findCuentaByCodigo("3.1.1");
        } else {
            cuentaUtilidad = findCuentaByCodigo("5.1.2");
        }

        List<AccountingEntryRequest.EntryItem> items = new ArrayList<>();

        for (IncomeStatementResponse.IncomeItem ing : income.getIngresos()) {
            if (ing.getSaldo() > 0) {
                items.add(entryItem(ing.getCuentaId(), ing.getSaldo(), 0L, "Cierre de " + ing.getCuentaNombre()));
            }
        }

        for (IncomeStatementResponse.IncomeItem gas : income.getGastos()) {
            if (gas.getSaldo() > 0) {
                items.add(entryItem(gas.getCuentaId(), 0L, gas.getSaldo(), "Cierre de " + gas.getCuentaNombre()));
            }
        }

        long totalCierre = 0L;
        for (var item : items) {
            if (item.getDebe() > 0) totalCierre += item.getDebe();
            if (item.getHaber() > 0) totalCierre += item.getHaber();
        }
        if (totalCierre <= 0L) {
            throw new RuntimeException("No hay movimientos que cerrar en el período " + periodoCodigo);
        }

        String concepto = "Cierre del período " + periodoCodigo;
        long absUtilidad = Math.abs(utilidad);

        items.add(entryItem(cuentaUtilidad, 0L, absUtilidad, "Utilidad del período"));
        items.add(entryItem(cuentaIngresos, 0L, 0L, "Contrapartida cierre ingresos"));

        List<AccountingEntryRequest.EntryItem> finalItems = new ArrayList<>();
        long sumaDebe = 0L;
        long sumaHaber = 0L;
        for (var item : items) {
            if (item.getDebe() > 0 || item.getHaber() > 0) {
                finalItems.add(item);
                sumaDebe += item.getDebe();
                sumaHaber += item.getHaber();
            }
        }

        if (sumaDebe > sumaHaber) {
            finalItems.add(entryItem(cuentaUtilidad, 0L, sumaDebe - sumaHaber, "Contrapartida cierre"));
        } else if (sumaHaber > sumaDebe) {
            finalItems.add(entryItem(cuentaUtilidad, sumaHaber - sumaDebe, 0L, "Contrapartida cierre"));
        }

        AccountingEntryRequest req = new AccountingEntryRequest();
        req.setFecha(periodo.getFechaFin().toString());
        req.setConcepto(concepto);
        req.setTipo("Diario");
        req.setReferenciaTipo("CIERRE");
        req.setReferenciaId(periodoCodigo);
        req.setCreadoPor(usuario);
        req.setItems(finalItems);
        createEntry(req);

        periodo.setCerrado(true);
        periodo.setCerradoPor(usuario);
        periodo.setCerradoEn(java.time.LocalDateTime.now());
        periodoRepository.save(periodo);
    }

    private void createAutoEntry(LocalDate fecha, String concepto, String tipo,
                                  String refTipo, String refId, String creadoPor,
                                  List<AccountingEntryRequest.EntryItem> items) {
        AccountingEntryRequest req = new AccountingEntryRequest();
        req.setFecha(fecha.toString());
        req.setConcepto(concepto);
        req.setTipo(tipo);
        req.setReferenciaTipo(refTipo);
        req.setReferenciaId(refId);
        req.setCreadoPor(creadoPor);
        req.setItems(items);
        createEntry(req);
    }

    private AccountingEntryRequest.EntryItem entryItem(String cuentaId, Long debe, Long haber, String glosa) {
        AccountingEntryRequest.EntryItem i = new AccountingEntryRequest.EntryItem();
        i.setCuentaId(cuentaId);
        i.setDebe(debe);
        i.setHaber(haber);
        i.setGlosa(glosa);
        return i;
    }

    private String findCuentaByCodigo(String codigo) {
        return catalogRepository.findById(codigo)
                .orElseThrow(() -> new RuntimeException("Cuenta " + codigo + " no encontrada en el catálogo"))
                .getId();
    }

    private int getIsvRate() {
        return settingsRepository.findAll().stream()
                .findFirst()
                .map(s -> s.getIsv() != null ? s.getIsv() : 15)
                .orElse(15);
    }

    // ── Reportes ──

    public LedgerResponse getLedger(String cuentaId, String desde, String hasta) {
        AccountCatalog cuenta = catalogRepository.findById(cuentaId)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        LocalDate fechaDesde = desde != null ? DateUtils.parseDate(desde) : LocalDate.of(2020, 1, 1);
        LocalDate fechaHasta = hasta != null ? DateUtils.parseDate(hasta) : LocalDate.now();

        List<AccountingEntryItem> items = itemRepository.findByCuentaId(cuentaId);
        List<LedgerResponse.LedgerItem> movimientos = new ArrayList<>();

        long saldo = 0L;
        for (AccountingEntryItem item : items) {
            AccountingEntry entry = entryRepository.findById(item.getAsientoId()).orElse(null);
            if (entry == null || entry.getFecha().isBefore(fechaDesde) || entry.getFecha().isAfter(fechaHasta))
                continue;

            LedgerResponse.LedgerItem mi = new LedgerResponse.LedgerItem();
            mi.setFecha(entry.getFecha() != null ? entry.getFecha().toString() : null);
            mi.setConcepto(entry.getConcepto());
            mi.setAsientoId(entry.getId());
            mi.setNumeroAsiento(entry.getNumeroAsiento());
            mi.setReferenciaTipo(entry.getReferenciaTipo());
            mi.setReferenciaId(entry.getReferenciaId());
            mi.setDebe(item.getDebe());
            mi.setHaber(item.getHaber());

            String tipo = cuenta.getTipo();
            if ("Activo".equals(tipo) || "Gasto".equals(tipo)) {
                saldo = saldo + item.getDebe() - item.getHaber();
            } else {
                saldo = saldo + item.getHaber() - item.getDebe();
            }
            mi.setSaldo(saldo);
            movimientos.add(mi);
        }

        LedgerResponse res = new LedgerResponse();
        res.setCuentaId(cuentaId);
        res.setCuentaCodigo(cuenta.getCodigo());
        res.setCuentaNombre(cuenta.getNombre());
        res.setSaldoInicial(0L);
        res.setTotalDebe(movimientos.stream().map(LedgerResponse.LedgerItem::getDebe).reduce(0L, Long::sum));
        res.setTotalHaber(movimientos.stream().map(LedgerResponse.LedgerItem::getHaber).reduce(0L, Long::sum));
        res.setSaldoFinal(saldo);
        res.setMovimientos(movimientos);
        return res;
    }

    public BalanceResponse getBalance() {
        List<AccountCatalog> cuentasActivo = catalogRepository.findByOrderByCodigoAsc().stream()
                .filter(c -> "Activo".equals(c.getTipo()) && c.getAceptaAsientos()).toList();
        List<AccountCatalog> cuentasPasivo = catalogRepository.findByOrderByCodigoAsc().stream()
                .filter(c -> "Pasivo".equals(c.getTipo()) && c.getAceptaAsientos()).toList();
        List<AccountCatalog> cuentasPatrimonio = catalogRepository.findByOrderByCodigoAsc().stream()
                .filter(c -> "Patrimonio".equals(c.getTipo()) && c.getAceptaAsientos()).toList();

        BalanceResponse res = new BalanceResponse();
        res.setFecha(LocalDate.now().toString());
        res.setActivos(cuentasActivo.stream().map(c -> balanceItem(c, calcSaldo(c))).toList());
        res.setPasivos(cuentasPasivo.stream().map(c -> balanceItem(c, calcSaldo(c))).toList());
        res.setPatrimonio(cuentasPatrimonio.stream().map(c -> balanceItem(c, calcSaldo(c))).toList());
        res.setTotalActivos(res.getActivos().stream().map(BalanceResponse.BalanceItem::getSaldo).reduce(0L, Long::sum));
        res.setTotalPasivos(res.getPasivos().stream().map(BalanceResponse.BalanceItem::getSaldo).reduce(0L, Long::sum));
        res.setTotalPatrimonio(res.getPatrimonio().stream().map(BalanceResponse.BalanceItem::getSaldo).reduce(0L, Long::sum));
        return res;
    }

    public IncomeStatementResponse getIncomeStatement() {
        return getIncomeStatement(null);
    }

    public IncomeStatementResponse getIncomeStatement(PeriodoContable periodo) {
        List<AccountCatalog> cuentasIngreso = catalogRepository.findByOrderByCodigoAsc().stream()
                .filter(c -> "Ingreso".equals(c.getTipo()) && c.getAceptaAsientos()).toList();
        List<AccountCatalog> cuentasGasto = catalogRepository.findByOrderByCodigoAsc().stream()
                .filter(c -> "Gasto".equals(c.getTipo()) && c.getAceptaAsientos()).toList();

        IncomeStatementResponse res = new IncomeStatementResponse();
        res.setFecha(LocalDate.now().toString());
        res.setIngresos(cuentasIngreso.stream().map(c -> incomeItem(c, calcSaldo(c, periodo))).toList());
        res.setGastos(cuentasGasto.stream().map(c -> incomeItem(c, calcSaldo(c, periodo))).toList());
        res.setTotalIngresos(res.getIngresos().stream().map(IncomeStatementResponse.IncomeItem::getSaldo).reduce(0L, Long::sum));
        res.setTotalGastos(res.getGastos().stream().map(IncomeStatementResponse.IncomeItem::getSaldo).reduce(0L, Long::sum));
        res.setResultadoNeto(res.getTotalIngresos() - res.getTotalGastos());
        return res;
    }

    private Long calcSaldo(AccountCatalog cuenta) {
        return calcSaldo(cuenta, null);
    }

    private Long calcSaldo(AccountCatalog cuenta, PeriodoContable periodo) {
        List<AccountingEntryItem> items = itemRepository.findByCuentaId(cuenta.getId());
        long totalDebe = 0L;
        long totalHaber = 0L;
        for (AccountingEntryItem item : items) {
            AccountingEntry entry = entryRepository.findById(item.getAsientoId()).orElse(null);
            if (entry == null) continue;
            if (periodo != null && (entry.getFecha().isBefore(periodo.getFechaInicio()) || entry.getFecha().isAfter(periodo.getFechaFin())))
                continue;
            totalDebe += item.getDebe();
            totalHaber += item.getHaber();
        }
        if ("Activo".equals(cuenta.getTipo()) || "Gasto".equals(cuenta.getTipo()))
            return totalDebe - totalHaber;
        else
            return totalHaber - totalDebe;
    }

    private BalanceResponse.BalanceItem balanceItem(AccountCatalog c, Long saldo) {
        BalanceResponse.BalanceItem i = new BalanceResponse.BalanceItem();
        i.setCuentaId(c.getId()); i.setCuentaCodigo(c.getCodigo());
        i.setCuentaNombre(c.getNombre()); i.setSaldo(saldo);
        return i;
    }

    private IncomeStatementResponse.IncomeItem incomeItem(AccountCatalog c, Long saldo) {
        IncomeStatementResponse.IncomeItem i = new IncomeStatementResponse.IncomeItem();
        i.setCuentaId(c.getId()); i.setCuentaCodigo(c.getCodigo());
        i.setCuentaNombre(c.getNombre()); i.setSaldo(saldo);
        return i;
    }

    // ── Mappers ──

    private AccountCatalogResponse toCatalogResponse(AccountCatalog a) {
        AccountCatalogResponse r = new AccountCatalogResponse();
        r.setId(a.getId()); r.setCodigo(a.getCodigo()); r.setNombre(a.getNombre());
        r.setTipo(a.getTipo()); r.setNivel(a.getNivel()); r.setPadreId(a.getPadreId());
        r.setAceptaAsientos(a.getAceptaAsientos()); r.setActivo(a.getActivo());
        return r;
    }

    private AccountingEntryResponse toEntryResponse(AccountingEntry e) {
        AccountingEntryResponse r = new AccountingEntryResponse();
        r.setId(e.getId());
        r.setNumeroAsiento(e.getNumeroAsiento());
        r.setFecha(e.getFecha() != null ? e.getFecha().toString() : null);
        r.setConcepto(e.getConcepto()); r.setTipo(e.getTipo());
        r.setReferenciaTipo(e.getReferenciaTipo()); r.setReferenciaId(e.getReferenciaId());
        r.setCreadoPor(e.getCreadoPor());
        r.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
        r.setTotalDebe(e.getTotalDebe()); r.setTotalHaber(e.getTotalHaber());
        r.setReversado(e.getReversado());

        List<AccountingEntryItem> items = itemRepository.findByAsientoId(e.getId());
        r.setItems(items.stream().map(item -> {
            AccountingEntryItemResponse ir = new AccountingEntryItemResponse();
            ir.setId(item.getId()); ir.setAsientoId(item.getAsientoId());
            ir.setCuentaId(item.getCuentaId());
            AccountCatalog cat = catalogRepository.findById(item.getCuentaId()).orElse(null);
            ir.setCuentaCodigo(cat != null ? cat.getCodigo() : "");
            ir.setCuentaNombre(cat != null ? cat.getNombre() : item.getCuentaId());
            ir.setDebe(item.getDebe()); ir.setHaber(item.getHaber()); ir.setGlosa(item.getGlosa());
            return ir;
        }).toList());
        return r;
    }

    public List<PeriodoContableResponse> getPeriodos() {
        return periodoRepository.findAll(Sort.by(Sort.Direction.DESC, "codigo")).stream()
                .map(p -> {
                    PeriodoContableResponse r = new PeriodoContableResponse();
                    r.setId(p.getId());
                    r.setCodigo(p.getCodigo());
                    r.setFechaInicio(p.getFechaInicio().toString());
                    r.setFechaFin(p.getFechaFin().toString());
                    r.setCerrado(p.getCerrado());
                    return r;
                }).toList();
    }
}
