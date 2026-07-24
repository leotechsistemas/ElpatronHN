---
name: java-avanzado
description: Use when implementing, refactoring, or reviewing backend Java code — Spring Boot, JPA/Hibernate, arquitectura limpia, patrones de diseño, testing, manejo de transacciones, seguridad, DTOs, validacion, servicios REST. Provides the HOW for features specified by contabilidad-general and validated by contabilidad-auditoria.
---

# Skill: Java Avanzado — Arquitectura y Buenas Prácticas

Eres un arquitecto de software senior especializado en Spring Boot 3+, JPA/Hibernate, y Java 17+. Tu función es implementar el código backend siguiendo las reglas de negocio definidas por `contabilidad-general` y validadas por `contabilidad-auditoria`.

## Stack del Proyecto

| Componente | Tecnología |
|------------|------------|
| Framework | Spring Boot 3.x |
| ORM | Hibernate / JPA |
| DB | H2 (file-based en `./data/patron-erp`) + PostgreSQL en prod |
| Serialización | Jackson con `SNAKE_CASE` |
| Seguridad | Spring Security + `@PreAuthorize` |
| Build | Maven (wrapper: `mvnw`) |
| Java | 17+ |

## Estructura de Paquetes

```
com.patron.erp
├── config/           → Configuración (CORS, Jackson, Security)
├── controller/       → REST controllers (delgados, solo delegan a service)
├── dto/
│   ├── request/      → Objetos de entrada (record o clase con validación)
│   └── response/     → Objetos de salida (inmutables idealmente)
├── exception/        → Excepciones de dominio + @ControllerAdvice
├── model/            → Entidades JPA (anotaciones puras, sin lógica de negocio)
├── repository/       → Spring Data JPA interfaces
├── service/          → Lógica de negocio (transaccional, validación, orquestación)
└── util/             → Utilidades (DateUtils, etc.)
```

## Principios de Diseño

### 1. Controladores Delgados

Los controllers SOLO:
- Reciben la request (validación básica con `@Valid`)
- Delegan al service
- Devuelven ResponseEntity con el status code apropiado

NO deben:
- Contener lógica de negocio
- Hacer cálculos
- Acceder a repositorios directamente

```java
// ✅ Bien
@PostMapping("/entries")
public ResponseEntity<AccountingEntryResponse> createEntry(@Valid @RequestBody AccountingEntryRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.createEntry(req));
}

// ❌ Mal
@PostMapping("/entries")
public ResponseEntity<AccountingEntryResponse> createEntry(@RequestBody AccountingEntryRequest req) {
    // lógica aquí... NO
}
```

### 2. Servicios con Responsabilidad Única

Cada método en el service debe hacer UNA cosa:

```java
@Service
@Transactional
public class AccountingService {
    
    public AccountingEntryResponse createEntry(AccountingEntryRequest req) {
        // 1. Validar negocio (debe = haber, fecha, período, etc.)
        // 2. Generar ID y número correlativo
        // 3. Crear entidad y persistir
        // 4. Retornar response
    }
    
    public void autoGenerateFromSale(...) {
        // Solo genera y crea el asiento de venta
    }
    
    public void autoGenerateCostOfSale(...) {
        // Solo genera y crea el asiento de costo
    }
}
```

### 3. Manejo de Excepciones

Usar excepciones de dominio específicas + `@ControllerAdvice`:

```java
// Dominio
public class AccountingException extends RuntimeException {
    private final String code; // "DEBE_HABER_MISMATCH", "PERIODO_CERRADO", etc.
    public AccountingException(String code, String message) { ... }
}

// Controller Advice
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(AccountingException.class)
    public ResponseEntity<ErrorResponse> handleAccounting(AccountingException e) {
        ErrorResponse err = new ErrorResponse(e.getCode(), e.getMessage());
        return ResponseEntity.badRequest().body(err);
    }
}
```

### 4. Transacciones

- `@Transactional` en el service, NO en el controller
- Métodos de solo lectura: `@Transactional(readOnly = true)`
- Auto-generación de asientos: llamar en una transacción SEPARADA (REQUIRES_NEW) para no afectar la transacción principal

```java
public class SaleService {
    @Transactional
    public SaleResponse createSale(...) {
        // ... crear venta ...
        try {
            accountingService.autoGenerateFromSaleAsync(...); // llamada separada
        } catch (Exception e) {
            log.warn("No se pudo generar asiento contable para venta {}", saleId, e);
        }
        return response;
    }
}
```

### 5. Patrón Builder para Objects Complejos

Para construcción compleja de asientos automáticos:

```java
// En vez de setters uno por uno:
AccountingEntryRequest req = AccountingEntryRequest.builder()
    .fecha(LocalDate.now().toString())
    .concepto("Venta " + ventaId)
    .tipo("Ingreso")
    .referenciaTipo("VENTA")
    .referenciaId(ventaId)
    .creadoPor(creadoPor)
    .item(c -> c.cuentaId(caja).debe(total).glosa("Pago"))
    .item(c -> c.cuentaId(ventas).haber(total).glosa("Venta"))
    .build();
```

## Patrones JPA Específicos

### 1. IDs y Generación de Correlativos

```java
// Para correlativo de asientos:
public interface AccountingEntryRepository extends JpaRepository<AccountingEntry, String> {
    
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(e.numeroAsiento, 13) AS integer)), 0) " +
           "FROM AccountingEntry e " +
           "WHERE e.numeroAsiento LIKE :prefix%")
    Integer findLastCorrelativeByPrefix(@Param("prefix") String prefix);
}

// En el service:
String prefix = "AS-" + year + "-" + String.format("%02d", month);
int last = entryRepository.findLastCorrelativeByPrefix(prefix);
String numero = prefix + "-" + String.format("%04d", last + 1);
```

### 2. Cálculo de Saldos (Eficiente)

NO traer todos los items a memoria para calcular saldos. Usar consulta agregada:

```java
@Query("SELECT COALESCE(SUM(i.debe), 0) - COALESCE(SUM(i.haber), 0) " +
       "FROM AccountingEntryItem i " +
       "JOIN AccountingEntry e ON e.id = i.asientoId " +
       "WHERE i.cuentaId = :cuentaId " +
       "AND e.fecha <= :fechaCorte")
BigDecimal calcularSaldo(@Param("cuentaId") String cuentaId, 
                         @Param("fechaCorte") LocalDate fechaCorte);
```

### 3. Cascade y Delete

NO usar `ON DELETE CASCADE` para accounting_entry_items — un borrado accidental de asientos borraría items sin control. Usar borrado lógico o reversiones:

```java
// ✅ Bien: reversión
public AccountingEntryResponse revertEntry(String entryId, String usuario) {
    AccountingEntry original = entryRepository.findById(entryId)
        .orElseThrow(() -> new AccountingException("NOT_FOUND", "Asiento no encontrado"));
    
    // Crear nuevo asiento con valores invertidos
    AccountingEntryRequest req = new AccountingEntryRequest();
    req.setConcepto("Reversión de " + original.getNumeroAsiento() + " - " + original.getConcepto());
    req.setFecha(LocalDate.now());
    req.setTipo(original.getTipo());
    req.setReferenciaTipo("REVERSIÓN");
    req.setReferenciaId(original.getId());
    // Items: intercambiar debe/haber
    for (var item : original.getItems()) {
        req.getItems().add(new EntryItem(item.getCuentaId(), item.getHaber(), item.getDebe(), "Reversión"));
    }
    return createEntry(req);
}
```

## Validación

### Anotaciones Jakarta Validation en DTOs request:

```java
public record AccountingEntryRequest(
    @NotNull @PastOrPresent LocalDate fecha,
    @NotBlank @Size(max = 500) String concepto,
    @NotBlank String tipo,
    @NotEmpty @Valid List<EntryItem> items
) {
    public record EntryItem(
        @NotBlank String cuentaId,
        @NotNull @DecimalMin("0.00") BigDecimal debe,
        @NotNull @DecimalMin("0.00") BigDecimal haber,
        String glosa
    ) {}
}
```

### Validación Cross-Campo (Debe = Haber):

Hacerla en el service, NO en el DTO. Es lógica de negocio:

```java
private void validateBalance(List<EntryItem> items) {
    BigDecimal totalDebe = items.stream()
        .map(EntryItem::debe).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal totalHaber = items.stream()
        .map(EntryItem::haber).reduce(BigDecimal.ZERO, BigDecimal::add);
    
    if (totalDebe.compareTo(totalHaber) != 0) {
        throw new AccountingException("DEBE_HABER_MISMATCH",
            "El asiento no cuadra: Debe (" + totalDebe + ") ≠ Haber (" + totalHaber + ")");
    }
}
```

## Pruebas

### Unit Tests (Service Layer)

```java
@ExtendWith(MockitoExtension.class)
class AccountingServiceTest {
    
    @Mock AccountingEntryRepository entryRepository;
    @Mock AccountingEntryItemRepository itemRepository;
    @InjectMocks AccountingService service;
    
    @Test
    void createEntry_withUnequalDebeHaber_shouldThrow() {
        var req = new AccountingEntryRequest(...items con debe≠haber...);
        assertThrows(AccountingException.class, () -> service.createEntry(req));
    }
    
    @Test
    void createEntry_withValidData_shouldReturnResponse() {
        // ...
    }
}
```

### Integration Tests (Controller Layer)

```java
@SpringBootTest
@AutoConfigureMockMvc
class AccountingControllerTest {
    
    @Autowired MockMvc mockMvc;
    
    @Test
    void createEntry_shouldReturn201() {
        mockMvc.perform(post("/api/accounting/entries")
            .contentType(MediaType.APPLICATION_JSON)
            .content(""" { "fecha": "2026-07-20", "items": [...] } """)
            .with(user("admin").roles("Admin")))
            .andExpect(status().isCreated());
    }
}
```

## Flujo de Reconstrucción del Módulo Contable

Cuando se active junto a `contabilidad-general` y `contabilidad-auditoria`, implementar en este orden:

### Fase 1: Base (Datos)
1. Agregar tabla `periodo_contable` a `schema.sql`
2. Agregar columna `numero_asiento` a `accounting_entries`
3. Crear entidad `PeriodoContable.java` y repositorio
4. Insertar períodos iniciales en `data.sql` (2020-01 hasta 2026-12)

### Fase 2: Core (Service)
5. Implementar generación de `numero_asiento` correlativo en `createEntry()`
6. Implementar validación de período abierto en `createEntry()`
7. Implementar asiento de apertura (método `initOpeningEntry()`)
8. Implementar `revertEntry()` en vez de `deleteEntry()`
9. Deshabilitar DELETE en controller (o redirigir a revert)

### Fase 3: Venta + ISV + Costo
10. Modificar `autoGenerateFromSale()` para incluir ISV (cuenta 2.1.1)
11. Agregar `autoGenerateCostOfSale()` que lea `invoice_items` y genere costo
12. Llamar autoGenerateCostOfSale desde SaleService

### Fase 4: Cierre
13. Implementar `closePeriod()` en el service
14. Agregar endpoint `POST /api/accounting/close-period`
15. Agregar botón de cierre en el frontend

### Fase 5: Frontend
16. Agregar columna `Número Asiento` en la tabla de Libro Diario
17. Agregar selector de período en reportes
18. Agregar botón de reversión en lugar de eliminar
19. Mostrar ISV desglosado en el asiento de venta

## Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `schema.sql` | Agregar `periodo_contable`, `numero_asiento`, `periodo_id` |
| `data.sql` | Insertar períodos 2020-01 al 2026-12 |
| `PeriodoContable.java` | **CREAR** nueva entidad JPA |
| `PeriodoContableRepository.java` | **CREAR** repositorio |
| `AccountingEntry.java` | Agregar campo `numeroAsiento` + `periodoId` |
| `AccountingEntryRequest.java` | Agregar validaciones cross-campo |
| `AccountingEntryResponse.java` | Agregar `numeroAsiento` |
| `AccountingService.java` | Modificar `createEntry()`, `deleteEntry()` → `revertEntry()`, agregar `autoGenerateCostOfSale()`, `closePeriod()`, `initOpeningEntry()` |
| `AccountingController.java` | Deshabilitar DELETE, agregar `POST /close-period` |
| `GlobalExceptionHandler.java` | **CREAR** o modificar existente |
| `SaleService.java` | Agregar llamada a autoGenerateCostOfSale |
| `AccountingView.tsx` | Agregar columnas y botones |
| `AccountingServiceTest.java` | **CREAR** tests unitarios |
| `AccountingControllerTest.java` | **CREAR** tests de integración |

## Verificación Final

Después de implementar, ejecutar:

```bash
cd backend-java
mvnw clean test        # Tests unitarios + integración
mvnw compile -q        # Verificar compilación
```

Y en frontend:
```bash
npx tsc --noEmit       # Verificar TypeScript
```
