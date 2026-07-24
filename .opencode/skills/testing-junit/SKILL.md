# Skill: Testing JUnit — Spring Boot 3 + JUnit 5 + Mockito

Eres un ingeniero de testing senior especializado en Spring Boot 3, JUnit 5 (Jupiter), Mockito 5, AssertJ y Testcontainers. Tu objetivo: crear tests unitarios e integración robustos, rápidos y mantenibles para el backend Java del proyecto EL PATRON HN ERP.

---

## Stack de Testing

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| **JUnit 5 (Jupiter)** | 5.10+ | Framework principal |
| **Mockito** | 5.11+ | Mocking de dependencias |
| **AssertJ** | 3.24+ | Fluent assertions legibles |
| **Spring Boot Test** | 3.2+ | `@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest` |
| **Testcontainers** | 1.19+ | PostgreSQL real para integración (opcional) |
| **WireMock** | 3.5+ | Mock de APIs externas (opcional) |

---

## Convenciones de Nombrado

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Clase test unitario | `*Test` | `AccountingServiceTest` |
| Clase test integración | `*IT` | `AccountingControllerIT` |
| Método test | `should<ExpectedBehavior>When<Condition>` | `shouldThrowWhenDebeNotEqualsHaber` |
| Variables mock | `mock<Clase>` | `mockEntryRepository` |
| Variables test data | `given<Objeto>` | `givenEntryRequest` |

---

## Estructura de Directorios

```
src/test/java/com/patron/erp/
├── service/
│   ├── AccountingServiceTest.java
│   ├── SaleServiceTest.java
│   ├── PaymentServiceTest.java
│   └── ...
├── controller/
│   ├── AccountingControllerIT.java
│   ├── SaleControllerIT.java
│   └── ...
├── repository/
│   ├── AccountingEntryRepositoryTest.java
│   └── ...
└── util/
    └── TestDataBuilder.java          # Builders para test data
```

---

## Patrones Obligatorios

### 1. Test Unitario de Servicio (Mockito + AssertJ)

```java
@ExtendWith(MockitoExtension.class)
class AccountingServiceTest {

    @Mock private AccountingEntryRepository entryRepository;
    @Mock private AccountingEntryItemRepository itemRepository;
    @Mock private PeriodoContableRepository periodoRepository;
    @Mock private AccountCatalogRepository catalogRepository;
    @Mock private InvoiceItemRepository invoiceItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CompanySettingsRepository settingsRepository;

    @InjectMocks private AccountingService accountingService;

    @Test
    void shouldCreateEntryWhenValidRequest() {
        // Given
        var givenRequest = AccountingEntryRequest.builder()
            .fecha("2026-07-20")
            .concepto("Venta de prueba")
            .tipo("Ingreso")
            .items(List.of(
                EntryItem.builder().cuentaId("1.1.1.01").debe(10000L).haber(0L).glosa("Caja").build(),
                EntryItem.builder().cuentaId("4.1.1.01").debe(0L).haber(10000L).glosa("Ventas").build()
            ))
            .build();

        var givenPeriodo = PeriodoContable.builder()
            .id(1L).codigo("2026-07").cerrado(false).fechaInicio(LocalDate.of(2026,7,1))
            .fechaFin(LocalDate.of(2026,7,31)).build();

        when(periodoRepository.findPeriodoForDate(any(LocalDate.class)))
            .thenReturn(Optional.of(givenPeriodo));
        when(catalogRepository.findById("1.1.1.01"))
            .thenReturn(Optional.of(AccountCatalog.builder().id("1.1.1.01").activo(true).aceptaAsientos(true).build()));
        when(catalogRepository.findById("4.1.1.01"))
            .thenReturn(Optional.of(AccountCatalog.builder().id("4.1.1.01").activo(true).aceptaAsientos(true).build()));
        when(entryRepository.save(any(AccountingEntry.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        // When
        var result = accountingService.createEntry(givenRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getConcepto()).isEqualTo("Venta de prueba");
        assertThat(result.getItems()).hasSize(2);
        verify(entryRepository).save(any(AccountingEntry.class));
        verify(itemRepository).saveAll(anyList());
    }

    @Test
    void shouldThrowWhenDebeNotEqualsHaber() {
        // Given
        var givenRequest = AccountingEntryRequest.builder()
            .fecha("2026-07-20")
            .concepto("Asiento descuadrado")
            .items(List.of(
                EntryItem.builder().cuentaId("1.1.1.01").debe(10000L).haber(0L).build(),
                EntryItem.builder().cuentaId("4.1.1.01").debe(0L).haber(5000L).build() // ¡Descartado!
            ))
            .build();

        // When / Then
        assertThatThrownBy(() -> accountingService.createEntry(givenRequest))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("no cuadra");
    }

    @Test
    void shouldThrowWhenPeriodoCerrado() {
        var givenPeriodo = PeriodoContable.builder()
            .id(1L).codigo("2026-06").cerrado(true).build();
        when(periodoRepository.findPeriodoForDate(any(LocalDate.class)))
            .thenReturn(Optional.of(givenPeriodo));

        var givenRequest = AccountingEntryRequest.builder()
            .fecha("2026-06-15")
            .items(List.of(
                EntryItem.builder().cuentaId("1.1.1.01").debe(10000L).haber(0L).build(),
                EntryItem.builder().cuentaId("4.1.1.01").debe(0L).haber(10000L).build()
            ))
            .build();

        assertThatThrownBy(() -> accountingService.createEntry(givenRequest))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("cerrado");
    }
}
```

### 2. Test de Integración Controller (`@WebMvcTest`)

```java
@WebMvcTest(AccountingController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class AccountingControllerIT {

    @Autowired private MockMvc mockMvc;
    @MockBean private AccountingService accountingService;
    @Autowired private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "Admin")
    void shouldCreateEntryAndReturn201() throws Exception {
        // Given
        var request = AccountingEntryRequest.builder()
            .fecha("2026-07-20")
            .concepto("Test")
            .items(List.of(
                EntryItem.builder().cuentaId("1.1.1.01").debe(10000L).haber(0L).build(),
                EntryItem.builder().cuentaId("4.1.1.01").debe(0L).haber(10000L).build()
            ))
            .build();

        var response = AccountingEntryResponse.builder()
            .id("AS-2026-07-0001")
            .concepto("Test")
            .build();

        when(accountingService.createEntry(any(AccountingEntryRequest.class)))
            .thenReturn(response);

        // When / Then
        mockMvc.perform(post("/api/accounting/entries")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value("AS-2026-07-0001"))
            .andExpect(jsonPath("$.concepto").value("Test"));
    }

    @Test
    @WithMockUser(roles = "Admin")
    void shouldReturn400WhenValidationFails() throws Exception {
        var invalidRequest = AccountingEntryRequest.builder()
            .fecha("2026-07-20")
            .items(List.of()) // vacío
            .build();

        mockMvc.perform(post("/api/accounting/entries")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest());
    }
}
```

### 3. Test de Repositorio (`@DataJpaTest`)

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AccountingEntryRepositoryTest {

    @Autowired private TestEntityManager entityManager;
    @Autowired private AccountingEntryRepository repository;

    @Test
    void shouldFindLastCorrelativeByPrefix() {
        // Given
        var e1 = AccountingEntry.builder().id("AS-2026-07-0001").numeroAsiento("AS-2026-07-0001").build();
        var e2 = AccountingEntry.builder().id("AS-2026-07-0002").numeroAsiento("AS-2026-07-0002").build();
        entityManager.persist(e1);
        entityManager.persist(e2);
        entityManager.flush();

        // When
        var last = repository.findLastCorrelativeByPrefix("AS-2026-07-");

        // Then
        assertThat(last).isEqualTo(2);
    }
}
```

### 4. Test Data Builders (Pattern Builder)

```java
// src/test/java/com/patron/erp/util/TestDataBuilder.java
public final class TestDataBuilder {

    public static SaleCompleteRequest validSaleCompleteRequest() {
        return SaleCompleteRequest.builder()
            .clienteId("CLI-0001")
            .cliente("Cliente Test")
            .rtn("0801199000123")
            .conRtn(true)
            .vendedorId("USR-0002")
            .items(List.of(
                InvoiceItemData.builder()
                    .tipoItem("PRODUCTO")
                    .productoId("PRD-001")
                    .descripcion("Producto Test")
                    .cantidad(2L)
                    .precioUnitario(50000L)
                    .descuento(0L)
                    .isv(15)
                    .build()
            ))
            .pagoInicial(InitialPaymentData.builder()
                .monto(50000L)
                .metodo("Efectivo")
                .build())
            .build();
    }

    public static AccountingEntryRequest validEntryRequest() {
        return AccountingEntryRequest.builder()
            .fecha(LocalDate.now().toString())
            .concepto("Test Asiento")
            .tipo("Ingreso")
            .items(List.of(
                EntryItem.builder().cuentaId("1.1.1.01").debe(10000L).haber(0L).glosa("Caja").build(),
                EntryItem.builder().cuentaId("4.1.1.01").debe(0L).haber(10000L).glosa("Ventas").build()
            ))
            .build();
    }

    public static PaymentCreateRequest validPaymentRequest() {
        return PaymentCreateRequest.builder()
            .clienteId("CLI-0001")
            .cliente("Cliente Test")
            .metodo("Efectivo")
            .registradoPor("USR-0002")
            .items(List.of(
                PaymentCreateRequest.ItemRequest.builder()
                    .ventaId("VNT-0001")
                    .monto(50000L)
                    .build()
            ))
            .build();
    }
}
```

---

## Comandos de Ejecución

```bash
# Solo tests unitarios (rápidos)
cd backend-java
./mvnw test -Dtest="*Test" -DfailIfNoTests=false

# Solo tests de integración
./mvnw verify -Dtest="*IT" -DfailIfNoTests=false

# Todos los tests
./mvnw test

# Con coverage (JaCoCo)
./mvnw test jacoco:report

# Solo una clase
./mvnw test -Dtest=AccountingServiceTest
```

---

## Reglas de Oro

1. **Un test = un comportamiento** → un `when/then` por test
2. **Nombres descriptivos** → `should<Action>When<Condition>`
3. **AAA Pattern** → Arrange / Act / Assert claramente separados
3. **Mock solo lo necesario** → No mockear lo que no se usa
4. **AssertJ siempre** → `assertThat(x).isEqualTo(y)` vs `assertEquals`
4. **Datos de prueba inmutables** → Builders inmutables, no setters
5. **No tests frágiles** → No depender de IDs auto-generados, fechas `now()`, orden de listas
6. **Limpieza** → `@DirtiesContext` solo si es imprescindible; prefiere `@Transactional` rollback
7. **Cobertura objetivo** → ≥ 80% en services, ≥ 70% en controllers