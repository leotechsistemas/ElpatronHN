# Skill: DTO Validation — Jakarta Bean Validation + Validación Cross-Field

Eres un experto en validación de datos en Spring Boot 3 con Jakarta Bean Validation (Hibernate Validator 8+). Tu objetivo: garantizar que **todos los DTOs de entrada** sean inmunes a datos maliciosos, incompletos o inconsistentes antes de llegar a la capa de servicio.

---

## Stack

| Componente | Versión | Configuración |
|------------|---------|---------------|
| **Jakarta Validation API** | 3.0+ | `jakarta.validation-api` |
| **Hibernate Validator** | 8.0+ | Proveedor de referencia |
| **Spring Boot Validation** | 3.2+ | Auto-config via `spring-boot-starter-validation` |
| **Jackson** | 2.17+ | `@JsonProperty`, `@JsonIgnoreProperties(ignoreUnknown = true)` |

---

## Dependencias (ya incluidas en `spring-boot-starter-web`)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

---

## Anotaciones Base (Jakarta Validation)

| Anotación | Uso | Ejemplo |
|-----------|-----|---------|
| `@NotNull` | No null (pero permite empty string) | `@NotNull private Long cantidad;` |
| `@NotBlank` | String no null, no empty, no solo espacios | `@NotBlank private String cliente;` |
| `@NotEmpty` | Collection/Map/Array/String no null ni vacía | `@NotEmpty private List<Item> items;` |
| `@Size(min, max)` | Longitud string/collection | `@Size(min=3, max=100) private String descripcion;` |
| `@Positive` / `@PositiveOrZero` | Número > 0 / ≥ 0 | `@Positive private Long monto;` |
| `@Negative` / `@NegativeOrZero` | Número < 0 / ≤ 0 | |
| `@Min` / `@Max` | Valor mínimo/máximo | `@Min(1) @Max(100) private Integer cantidad;` |
| `@DecimalMin` / `@DecimalMax` | BigDecimal/Double min/max | `@DecimalMin("0.01") private BigDecimal precio;` |
| `@Digits(integer, fraction)` | Precisión decimal | `@Digits(integer=10, fraction=2) private BigDecimal precio;` |
| `@Email` | Formato email válido | `@Email private String email;` |
| `@Pattern(regexp)` | Regex personalizado | `@Pattern(regexp="^\\d{13}$") private String rtn;` |
| `@Past` / `@PastOrPresent` / `@Future` | Fechas | `@PastOrPresent private LocalDate fecha;` |
| `@Valid` | Validación cascada en objetos anidados | `@Valid private List<ItemRequest> items;` |

---

## DTOs del Proyecto — Validaciones Requeridas

### 1. `SaleCompleteRequest` (POST `/api/sales/complete`)

```java
public class SaleCompleteRequest {

    @NotBlank(message = "Cliente ID es obligatorio")
    private String clienteId;

    @NotBlank(message = "Cliente nombre es obligatorio")
    @Size(max = 200)
    private String cliente;

    @Pattern(regexp = "^\\d{14}$", message = "RTN debe tener 14 dígitos")
    private String rtn;

    private Boolean conRtn = true;

    @Size(max = 1000)
    private String observaciones;

    @NotBlank(message = "Vendedor ID es obligatorio")
    private String vendedorId;

    @NotEmpty(message = "Debe haber al menos un item")
    @Valid
    private List<InvoiceItemData> items;

    private InitialPaymentData pagoInicial;

    // --- Nested DTOs ---

    public static class InvoiceItemData {

        @NotBlank(message = "Tipo item obligatorio: PRODUCTO o SERVICIO")
        @Pattern(regexp = "^(PRODUCTO|SERVICIO)$", message = "Tipo item debe ser PRODUCTO o SERVICIO")
        private String tipoItem;

        private String productoId;
        private String servicioId;

        @NotBlank(message = "Descripción obligatoria")
        @Size(max = 500)
        private String descripcion;

        @Positive(message = "Cantidad debe ser > 0")
        private Long cantidad = 1L;

        @Positive(message = "Precio unitario debe ser > 0")
        private Long precioUnitario;

        @PositiveOrZero(message = "Descuento no puede ser negativo")
        private Long descuento = 0L;

        @Min(value = 0, message = "ISV no puede ser negativo")
        @Max(value = 100, message = "ISV no puede exceder 100%")
        private Integer isv = 15;

        // Cross-field: PRODUCTO requiere productoId, SERVICIO requiere servicioId
        // Validado en @Validated service
    }

    public static class InitialPaymentData {
        @Positive(message = "Monto inicial debe ser > 0")
        private Long monto;

        @NotBlank(message = "Método de pago obligatorio")
        @Pattern(regexp = "^(Efectivo|Tarjeta|Transferencia)$", message = "Método inválido")
        private String metodo;
    }
}
```

### 2. `PaymentCreateRequest` (POST `/api/payments`)

```java
public class PaymentCreateRequest {

    @NotBlank(message = "Cliente ID obligatorio")
    private String clienteId;

    @NotBlank(message = "Cliente nombre obligatorio")
    @Size(max = 200)
    private String cliente;

    @NotBlank(message = "Método obligatorio")
    @Pattern(regexp = "^(Efectivo|Tarjeta|Transferencia)$", message = "Método: Efectivo, Tarjeta o Transferencia")
    private String metodo;

    @Size(max = 500)
    private String observaciones;

    @NotBlank(message = "Registrado por obligatorio")
    private String registradoPor;

    @NotEmpty(message = "Debe haber al menos un item de pago")
    @Valid
    private List<ItemRequest> items;

    public static class ItemRequest {

        @NotBlank(message = "Venta ID obligatorio")
        private String ventaId;

        @Positive(message = "Monto debe ser > 0")
        private Long monto;
    }
}
```

### 3. `AccountingEntryRequest` (POST `/api/accounting/entries`)

```java
public class AccountingEntryRequest {

    @NotNull(message = "Fecha obligatoria")
    @PastOrPresent(message = "Fecha no puede ser futura")
    private LocalDate fecha;

    @NotBlank(message = "Concepto obligatorio")
    @Size(max = 500)
    private String concepto;

    @NotBlank(message = "Tipo obligatorio")
    @Pattern(regexp = "^(Ingreso|Egreso|Ajuste|Apertura|Cierre)$", message = "Tipo inválido")
    private String tipo;

    @NotEmpty(message = "El asiento debe tener al menos un item")
    @Valid
    private List<EntryItem> items;

    public static class EntryItem {

        @NotBlank(message = "Cuenta ID obligatorio")
        private String cuentaId;

        @PositiveOrZero(message = "Debe no puede ser negativo")
        private Long debe = 0L;

        @PositiveOrZero(message = "Haber no puede ser negativo")
        private Long haber = 0L;

        @Size(max = 200)
        private String glosa;
    }
}
```

### 4. `SaleRequest` (POST `/api/sales`)

```java
public class SaleRequest {

    @NotNull(message = "Fecha obligatoria")
    @PastOrPresent
    private LocalDate fecha;

    @NotBlank private String clienteId;
    @NotBlank private String cliente;
    private String rtn;
    private Boolean conRtn = true;

    private String productoId;
    private String producto;

    @NotBlank private String tipoTrabajo;

    @Positive(message = "Precio debe ser > 0")
    private Long precio;

    @NotBlank(message = "Estado obligatorio")
    @Pattern(regexp = "^(Pendiente|En proceso|Terminado)$")
    private String estado;

    @PositiveOrZero private Long pagoInicial = 0L;

    @NotBlank(message = "Estado pago obligatorio")
    @Pattern(regexp = "^(Pendiente|Pagado)$")
    private String estadoPago;

    private String observaciones;
    private String vendedorId;
}
```

---

## Validación Cross-Field (Service Layer)

Las validaciones que involucran **múltiples campos** o **lógica de negocio** NO van en el DTO, van en el **Service** con excepciones de dominio.

### Ejemplo: `AccountingService.createEntry()`

```java
@Transactional
public AccountingEntryResponse createEntry(AccountingEntryRequest req) {
    // 1. Validaciones de negocio (cross-field)
    validateEntryRequest(req);

    // 2. Validar período
    LocalDate fecha = DateUtils.parseDate(req.getFecha());
    PeriodoContable periodo = periodoRepository.findPeriodoForDate(fecha)
        .orElseThrow(() -> new AccountingException("PERIODO_NO_ENCONTRADO", 
            "No hay período contable para " + fecha));

    if (periodo.getCerrado())
        throw new AccountingException("PERIODO_CERRADO", 
            "El período " + periodo.getCodigo() + " está cerrado");

    // 3. Validar debe = haber
    long totalDebe = req.getItems().stream()
        .mapToLong(i -> i.getDebe() != null ? i.getDebe() : 0L).sum();
    long totalHaber = req.getItems().stream()
        .mapToLong(i -> i.getHaber() != null ? i.getHaber() : 0L).sum();

    if (totalDebe != totalHaber)
        throw new AccountingException("DEBE_HABER_MISMATCH",
            "El asiento no cuadra: Debe (" + totalDebe + ") ≠ Haber (" + totalHaber + ")");

    // 4. Validar cuentas existen y están activas
    for (var item : req.getItems()) {
        AccountCatalog cuenta = catalogRepository.findById(item.getCuentaId())
            .orElseThrow(() -> new AccountingException("CUENTA_NO_EXISTE", 
                "Cuenta " + item.getCuentaId() + " no existe"));
        if (!cuenta.getActivo() || !cuenta.getAceptaAsientos())
            throw new AccountingException("CUENTA_INACTIVA",
                "Cuenta " + item.getCuentaId() + " no acepta asientos");
    }

    // 5. Validar fecha no futura
    if (fecha.isAfter(LocalDate.now()))
        throw new AccountingException("FECHA_FUTURA", "La fecha no puede ser futura");

    // ... resto de la lógica
}
```

### Excepción de Dominio

```java
public class AccountingException extends RuntimeException {
    private final String code;

    public AccountingException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() { return code; }
}
```

### Handler Global (ya existe en `GlobalExceptionHandler`)

```java
@ExceptionHandler(AccountingException.class)
public ResponseEntity<Map<String, String>> handleAccounting(AccountingException ex) {
    log.warn("Error contable [{}]: {}", ex.getCode(), ex.getMessage());
    Map<String, String> error = new HashMap<>();
    error.put("code", ex.getCode());
    error.put("error", ex.getMessage());
    return ResponseEntity.badRequest().body(error);
}
```

---

## Validación Cross-Field en DTOs (Opcional: `@ScriptAssert`)

Para validaciones simples cross-field **en el DTO** sin ir al service:

```java
@ScriptAssert(lang = "javascript", 
    script = "_this.tipoItem.equals('PRODUCTO') ? _this.productoId != null : _this.servicioId != null",
    message = "PRODUCTO requiere productoId, SERVICIO requiere servicioId")
public static class InvoiceItemData {
    // ...
}
```

> **Nota**: Requiere dependencia `org.glassfish:javax.script` y habilitar JSR-223. Preferible validar en Service.

---

## Configuración Global (application.yml)

```yaml
spring:
  mvc:
    validation:
      enabled: true
  jackson:
    default-property-inclusion: NON_NULL
    deserialization:
      FAIL_ON_UNKNOWN_PROPERTIES: false
```

---

## Checklist de Validación por DTO

| DTO | `@NotBlank` | `@NotEmpty` | `@Valid` nested | Cross-field (service) | Regex/Pattern |
|-----|-------------|-------------|-----------------|----------------------|---------------|
| `SaleCompleteRequest` | ✅ clienteId, cliente, vendedorId | ✅ items | ✅ InvoiceItemData | tipoItem ↔ productoId/servicioId | RTN 14 dígitos |
| `InvoiceItemData` | ✅ tipoItem, descripcion | | | tipoItem ↔ productoId/servicioId | tipoItem: PRODUCTO\|SERVICIO |
| `InitialPaymentData` | ✅ metodo | | | monto > 0 | metodo: Efectivo\|Tarjeta\|Transferencia |
| `PaymentCreateRequest` | ✅ clienteId, cliente, metodo, registradoPor | ✅ items | ✅ ItemRequest | | metodo regex |
| `ItemRequest` (payment) | ✅ ventaId | | | monto > 0 | |
| `AccountingEntryRequest` | ✅ concepto, tipo | ✅ items | ✅ EntryItem | debe = haber, cuentas activas, período abierto | fecha @PastOrPresent, tipo enum |
| `EntryItem` | ✅ cuentaId | | | debe/haber ≥ 0, cuenta existe y activa | |

---

## Tests de Validación (Obligatorios)

```java
@ExtendWith(MockitoExtension.class)
class SaleCompleteRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void shouldFailWhenClienteIdBlank() {
        var req = TestDataBuilder.validSaleCompleteRequest().toBuilder()
            .clienteId("").build();
        var violations = validator.validate(req);
        assertThat(violations).extracting(ConstraintViolation::getMessage)
            .contains("Cliente ID es obligatorio");
    }

    @Test
    void shouldFailWhenItemsEmpty() {
        var req = TestDataBuilder.validSaleCompleteRequest().toBuilder()
            .items(List.of()).build();
        var violations = validator.validate(req);
        assertThat(violations).extracting(ConstraintViolation::getMessage)
            .contains("Debe haber al menos un item");
    }

    @Test
    void shouldFailWhenItemTipoInvalido() {
        var item = InvoiceItemData.builder()
            .tipoItem("INVALIDO")
            .descripcion("Test")
            .cantidad(1L)
            .precioUnitario(1000L)
            .build();

        var req = TestDataBuilder.validSaleCompleteRequest().toBuilder()
            .items(List.of(item)).build();

        var violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> 
            v.getMessage().contains("Tipo item debe ser PRODUCTO o SERVICIO"));
    }

    @Test
    void shouldFailWhenProductoRequiereProductoId() {
        var item = InvoiceItemData.builder()
            .tipoItem("PRODUCTO")
            .descripcion("Test")
            .cantidad(1L)
            .precioUnitario(1000L)
            .productoId(null) // faltante
            .build();

        var req = TestDataBuilder.validSaleCompleteRequest().toBuilder()
            .items(List.of(item)).build();

        // Validación cross-field: se valida en service, pero si usas @ScriptAssert:
        // var violations = validator.validate(req);
        // assertThat(violations).anyMatch(...);
    }
}
```

---

## Integración con `java-avanzado` Skill

Al implementar features contables (`contabilidad-general` + `contabilidad-auditoria`):

1. **DTOs validados** → `@Valid` en controller → `GlobalExceptionHandler` captura `MethodArgumentNotValidException`
2. **Validación cross-field en Service** → Lanza `AccountingException(code, message)`
3. **Handler global** → Convierte a `ResponseEntity<Map<String,String>>` con `{code, error}`
4. **Tests** → `AccountingServiceTest` cubre casos válidos + inválidos (debe≠haber, período cerrado, cuenta inactiva, fecha futura)

---

## Checklist Final

- [ ] Todos los DTOs request tienen `@Valid` en controller
- [ ] Anotaciones básicas (`@NotBlank`, `@NotEmpty`, `@Positive`, `@Size`, `@Pattern`) aplicadas
- [ ] Validaciones cross-field en **Service** con excepciones tipadas (`*Exception`)
- [ ] `GlobalExceptionHandler` maneja `MethodArgumentNotValidException`, `AccountingException`, etc.
- [ ] Tests de validación para cada DTO (`*ValidationTest`)
- [ ] Tests unitarios de service cubren casos válidos + inválidos
- [ ] Tests de integración controller (`@WebMvcTest`) verifican 400/201
- [ ] `MonetaryUtil` usa `BigDecimal` o `String` (no `Double`)
- [ ] Entidades tienen auditoría (`@CreatedDate`, `@LastModifiedDate`) si corresponde