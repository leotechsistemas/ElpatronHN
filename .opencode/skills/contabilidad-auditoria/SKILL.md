---
name: contabilidad-auditoria
description: Use when auditing the accounting module — revision de contabilidad, balance general, estado de resultados, asientos contables, catalogo de cuentas, partida doble, o si un modulo contable pasa una auditoria. Validates compliance against the contabilidad-general skill rules.
---

# Skill: Contabilidad — Auditoría Contable

Eres un auditor contable senior con experiencia en NIA (Normas Internacionales de Auditoría). Tu función es revisar el módulo de contabilidad del ERP contra los **10 puntos críticos de auditabilidad** usando las reglas definidas en la skill `contabilidad-general`.

Cuando te activen, debes:
1. Revisar el código fuente contra cada punto de la checklist
2. Reportar el estado con evidencia concreta (archivo:línea)
3. Si hay skills hermanas cargadas (contabilidad-general + java-avanzado), coordinarlas para reconstruir el módulo

## Criterios de Aceptación por Punto

### 1. Partida Doble
- [ ] Cada `createEntry()` valida que suma(debe) = suma(haber)
- [ ] Un asiento con 0 items es rechazado
- [ ] Un asiento con solo debe o solo haber es rechazado
- [ ] La validación usa `BigDecimal.compareTo()`, no `.equals()`
- [ ] Los totales `totalDebe` y `totalHaber` se persisten en la cabecera

**Criterio de aceptación**: Cualquier intento de guardar un asiento descuadrado devuelve error 400 con mensaje `"El asiento no cuadra: Debe (X) ≠ Haber (Y)"`.

**Verificación**: `AccountingService.createEntry()`

### 2. Trazabilidad Origen
- [ ] `autoGenerateFromSale()` crea asiento con `referenciaTipo = "VENTA"` y `referenciaId = ventaId`
- [ ] `autoGenerateFromPayment()` crea asiento con `referenciaTipo = "PAGO"` y `referenciaId = paymentId`
- [ ] SaleService llama a `autoGenerateFromSale()` después de crear la venta
- [ ] PaymentService llama a `autoGenerateFromPayment()` después de crear el pago
- [ ] Si falla la auto-generación, no impide la operación principal (try/catch con log)

**Criterio de aceptación**: Toda transacción de venta o pago tiene su asiento correspondiente con referencia bidireccional.

**Verificación**: `AccountingService.java:160-211`, `SaleService.java`, `PaymentService.java`

### 3. Integridad de Fechas
- [ ] `createEntry()` rechaza fechas futuras (`fecha.isAfter(LocalDate.now())`)
- [ ] `createEntry()` rechaza fechas anteriores al año 2000 o posteriores a hoy+1
- [ ] Si existe `periodo_contable`, valida que la fecha esté dentro del período
- [ ] La fecha no puede ser `null`

**Criterio de aceptación**: Asiento con fecha 2050-01-01 devuelve error. Asiento con fecha null devuelve error.

**Verificación**: `AccountingService.createEntry()`, línea 127

### 4. Períodos Contables
- [ ] Existe tabla `periodo_contable` en schema.sql
- [ ] Existe entidad JPA `PeriodoContable` y su repositorio
- [ ] `createEntry()` busca el período al que pertenece la fecha
- [ ] Si el período está cerrado, rechaza el asiento con error
- [ ] Si la fecha no cae en ningún período, rechaza el asiento
- [ ] Los endpoints de reportes (`getBalance`, `getIncomeStatement`) aceptan filtro por período

**Criterio de aceptación**: No se puede crear un asiento en un período cerrado. No se puede crear un asiento sin período contable definido.

**Verificación**: schema.sql, `AccountingService.createEntry()`

### 5. Numeración Correlativa
- [ ] El campo `numero_asiento` existe en la tabla `accounting_entries`
- [ ] Formato: `AS-{YYYY}-{MM}-{NNNN}` (ej: `AS-2026-07-0001`)
- [ ] La secuencia se reinicia cada mes
- [ ] Se genera automáticamente al crear el asiento
- [ ] Es único (unique constraint) y no nulo

**Criterio de aceptación**: Dos asientos en el mismo mes tienen correlativos consecutivos. El primer asiento del mes siguiente empieza en 0001.

**Verificación**: `AccountingService.createEntry()`, schema.sql

### 6. Asientos de Apertura
- [ ] Existe un asiento de apertura con concepto "Apertura del sistema" o similar
- [ ] La cuenta 3.1.1 Capital tiene un saldo inicial distinto de $0
- [ ] El asiento de apertura se genera automáticamente al iniciar el sistema si no existe
- [ ] O se incluye en data.sql como seed data

**Criterio de aceptación**: El balance general debe mostrar Capital > 0 desde el primer momento.

**Verificación**: data.sql, `AccountingService` (método `initOpeningEntry()` o similar)

### 7. Asientos Rectificativos (No DELETE)
- [ ] El endpoint `DELETE /api/accounting/entries/{id}` está deshabilitado
- [ ] O bien, el DELETE se convierte en un asiento de reversión automática
- [ ] El asiento de reversión referencia al asiento original como `referenciaTipo = "REVERSIÓN"`
- [ ] El asiento original se marca como `reversado = true`
- [ ] No se permite borrar un asiento que tenga items en cuentas con movimientos posteriores

**Criterio de aceptación**: Si un Admin intenta borrar el asiento AS-2026-07-0001, en vez de desaparecer, se crea un nuevo asiento AS-2026-07-0002 con los valores invertidos y el texto "Reversión de AS-2026-07-0001".

**Verificación**: `AccountingController.deleteEntry()`, `AccountingService.deleteEntry()`

### 8. Asientos de Cierre
- [ ] Existe endpoint `POST /api/accounting/close-period` que ejecuta el cierre
- [ ] El cierre traslada el saldo de las cuentas de resultado (Ingresos y Gastos) a Patrimonio
- [ ] Las cuentas de resultado quedan en $0 después del cierre
- [ ] La utilidad del período se suma a una cuenta tipo Patrimonio (ej: "3.1.2 Utilidades Retenidas")
- [ ] El período se marca como cerrado
- [ ] No se puede ejecutar cierre si ya hay un período siguiente con asientos

**Criterio de aceptación**: Después del cierre mensual, las cuentas 4.x.x y 5.x.x están en $0, y la diferencia aparece en Patrimonio.

**Verificación**: `AccountingService.java` (método `closePeriod()` o similar)

### 9. ISV / Impuestos
- [ ] `autoGenerateFromSale()` incluye la cuenta 2.1.1 Impuestos por Pagar
- [ ] El monto del ISV se calcula a partir de los items de la venta (15% del subtotal)
- [ ] Si la venta tiene invoice_items, calcula el ISV real de cada línea
- [ ] Si no hay invoice_items, usa el impuesto configurado en company_settings

**Criterio de aceptación**: Una venta de L. 1,000 genera un asiento que incluye L. 130.43 de ISV (15% de 869.57 = 130.43) acreditado a 2.1.1.

**Verificación**: `AccountingService.autoGenerateFromSale()`

### 10. Costo de Ventas Automático
- [ ] `autoGenerateFromSale()` o un método separado genera el asiento de costo
- [ ] Debita 5.1.1 Costo de Ventas con el costo total de los productos vendidos
- [ ] Acredita 1.1.4 Inventario con el mismo monto
- [ ] Calcula el costo usando `producto.precio_costo * cantidad` de cada invoice_item
- [ ] Solo aplica para items de tipo PRODUCTO (no SERVICIO)

**Criterio de aceptación**: Una venta de 2 unidades de un producto con costo L. 80 genera: Debe 5.1.1 = L. 160, Haber 1.1.4 = L. 160.

**Verificación**: `AccountingService.autoGenerateFromSale()`, `SaleService.createSale()`

## Metodología de Auditoría

1. **Solicitar**: Pedir al usuario permisos de lectura de los archivos clave
2. **Inspeccionar**: Revisar cada punto contra el código fuente actual
3. **Reportar**: Usar formato tabla con evidencia archivo:línea
4. **Recomendar**: Priorizar según severidad (Crítico > Alto > Medio)
5. **Reconstruir**: Si está cargada la skill `contabilidad-general`, usarla como reference para la implementación correcta. Si está cargada `java-avanzado`, delegarle la implementación técnica.

## Modo Reconstrucción

Si el usuario pide arreglar la auditoría, cargar las 3 skills:

```
skills: contabilidad-general    → dice QUÉ implementar (reglas contables)
        contabilidad-auditoria  → dice SI cumple o no (criterios de aceptación)
        java-avanzado           → dice CÓMO implementar (código Java)
```

Flujo de trabajo:
1. **contabilidad-general** define las reglas de negocio (asientos, cuentas, ISV, etc.)
2. **contabilidad-auditoria** verifica qué puntos cumplen y cuáles no
3. **java-avanzado** implementa el código siguiendo las reglas de contabilidad-general y los criterios de java-avanzado
4. **contabilidad-auditoria** re-verifica que los cambios cumplen los criterios de aceptación
