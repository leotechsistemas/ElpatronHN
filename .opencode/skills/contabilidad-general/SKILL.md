---
name: contabilidad-general
description: Use when implementing or refactoring accounting features — partida doble, catalogo de cuentas, asientos contables, balance general, estado de resultados, libro mayor, periodos contables, cierre contable, ISV, costo de ventas, asientos de apertura, numeracion correlativa. Domain expert for accounting rules in the ERP.
---

# Skill: Contabilidad General — Experto en Teoría Contable

Eres un contador senior con expertise en NIC (Normas Internacionales de Contabilidad) y regulación fiscal hondureña. Cuando te activen, debes guiar la implementación correcta de cualquier feature contable en el ERP.

## Estructura del Catálogo de Cuentas

Este ERP usa catálogo de cuentas jerárquico con 5 tipos:

| Tipo | Prefijo | Naturaleza | Ejemplos |
|------|---------|------------|----------|
| Activo | 1 | Deudora | Caja, Bancos, CxC, Inventario |
| Pasivo | 2 | Acreedora | Impuestos por Pagar |
| Patrimonio | 3 | Acreedora | Capital, Utilidades Retenidas |
| Ingreso | 4 | Acreedora | Ventas |
| Gasto | 5 | Deudora | Costo de Ventas, Gastos Operativos |

**Regla de saldo**: Para cuentas de naturaleza Deudora (Activo, Gasto): `saldo = Σ(debes) - Σ(haberes)`. Para cuentas de naturaleza Acreedora (Pasivo, Patrimonio, Ingreso): `saldo = Σ(haberes) - Σ(debes)`.

## Reglas de Partida Doble para este ERP

Cada transacción de negocio genera asientos específicos:

### Venta al Contado
```
  Debe: Caja/Bancos (total + ISV)     --- por el pago recibido
  Haber: Ventas (subtotal)            --- por el ingreso
  Haber: Impuestos por Pagar (ISV)    --- por el impuesto
```
Y simultáneamente:
```
  Debe: Costo de Ventas               --- por el costo del producto
  Haber: Inventario                   --- por la salida del inventario
```

### Venta a Crédito
```
  Debe: Cuentas por Cobrar (total + ISV) --- por el total a cobrar
  Haber: Ventas (subtotal)                --- por el ingreso
  Haber: Impuestos por Pagar (ISV)        --- por el impuesto
```
Y simultáneamente:
```
  Debe: Costo de Ventas               --- por el costo del producto
  Haber: Inventario                   --- por la salida del inventario
```

### Venta con Pago Inicial (mixta)
```
  Debe: Caja/Bancos (pago inicial)       --- por el anticipo
  Debe: Cuentas por Cobrar (saldo)       --- por el saldo pendiente
  Haber: Ventas (subtotal)               --- por el ingreso total
  Haber: Impuestos por Pagar (ISV)       --- por el impuesto total
```

### Cobro de Cuentas por Cobrar
```
  Debe: Caja/Bancos (monto)           --- por el cobro recibido
  Haber: Cuentas por Cobrar (monto)   --- por la cancelación de la deuda
```

### Asiento de Apertura (inicio de operaciones)
```
  Debe: Caja (capital inicial)        --- por el aporte de capital
  Haber: Capital                      --- por el patrimonio inicial
```

### Asiento de Cierre de Período
```
  Debe: Ventas (saldo total)              --- para cancelar la cuenta
  Haber: Pérdidas y Ganancias (saldo)     --- por el total de ingresos
```
```
  Debe: Pérdidas y Ganancias (saldo)      --- por el total de gastos
  Haber: Costo de Ventas (saldo total)    --- para cancelar la cuenta
  Haber: Gastos Operativos (saldo total)  --- para cancelar la cuenta
```
```
  Debe: Pérdidas y Ganancias (utilidad)   --- por la utilidad del período
  Haber: Utilidades Retenidas (utilidad)  --- para capitalizar utilidades
```

## Reglas de ISV (Impuesto Sobre Ventas) — Honduras

- Tasa estándar: 15% (configurable en `company_settings.isv`)
- El ISV se calcula sobre el subtotal: `subtotal = precio_unitario * cantidad - descuento`
- El ISV se registra como un pasivo (2.1.1 Impuestos por Pagar)
- Fórmula: `isv_monto = subtotal * (tasa_isv / 100)`
- `total_linea = subtotal + isv_monto`
- El asiento de venta SIEMPRE debe separar el subtotal del ISV

## Numeración Correlativa de Asientos

Formato estándar para este ERP: `AS-{YYYY}-{MM}-{NNNN}` donde `{NNNN}` es secuencial por mes.

Ejemplo: `AS-2026-07-0001`, `AS-2026-07-0002`, ..., `AS-2026-08-0001`

La secuencia debe reiniciarse cada mes y almacenarse en la tabla `accounting_entries` junto con un correlativo por año en la tabla `secuencia_asientos` (o calcularse con `SELECT MAX(...)`).

## Períodos Contables

Cada asiento pertenece a un período contable. Estructura:

```
periodo_contable {
  id BIGINT PK AUTO_INCREMENT,
  codigo VARCHAR(7) NOT NULL UNIQUE,         -- ej: "2026-07"
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  cerrado BOOLEAN NOT NULL DEFAULT FALSE,
  cerrado_por VARCHAR(20) REFERENCES users(id),
  cerrado_en TIMESTAMP
}
```

- No se pueden crear asientos en períodos cerrados
- No se pueden crear asientos con fecha fuera del rango del período
- El cierre mensual genera asientos de cierre automáticos

## Reglas de Validación de Asientos

1. **Debe = Haber**: La suma total de debe debe ser exactamente igual a la suma total de haber
2. **Fecha válida**: La fecha no puede ser futura ni anterior al inicio del período contable
3. **Cuenta activa**: La cuenta debe existir y estar activa en el catálogo
4. **Cuenta de detalle**: La cuenta debe aceptar asientos (`acepta_asientos = true`); cuentas de nivel 1 y 2 son de agrupación y no aceptan asientos
5. **Referencia válida**: Si hay referencia (VENTA/PAGO), el ID debe existir
6. **Usuario válido**: El creador debe ser un usuario activo con rol Admin o Analista
7. **Período abierto**: El asiento debe caer en un período contable abierto

## Reportes Contables

### Balance General
- Fecha de corte: hoy o la fecha del último período cerrado
- Agrupa por: Activo (ordenado por liquidez), Pasivo (ordenado por exigibilidad), Patrimonio
- Debe cuadrar: Total Activos = Total Pasivos + Total Patrimonio
- Incluye utilidad del período en Patrimonio si no se ha cerrado

### Estado de Resultados
- Período: mensual o acumulado anual
- Muestra: Ingresos (ordenados), Gastos (ordenados), Resultado Neto
- Fórmula: Resultado Neto = Total Ingresos - Total Gastos

### Libro Mayor por Cuenta
- Muestra: fecha, concepto, debe, haber, saldo acumulado
- Saldo inicial, total debe, total haber, saldo final
- Filtro por rango de fechas

## Estructura de Tablas Recomendada

```sql
-- Tabla ya existente
account_catalog (id, codigo, nombre, tipo, nivel, padre_id, acepta_asientos, activo)

-- Tabla ya existente
accounting_entries (id, fecha, concepto, tipo, referencia_tipo, referencia_id, creado_por, created_at, total_debe, total_haber)

-- Tabla ya existente
accounting_entry_items (id, asiento_id, cuenta_id, debe, haber, glosa)

-- NUEVA: Períodos contables
periodo_contable (id, codigo, fecha_inicio, fecha_fin, cerrado, cerrado_por, cerrado_en)

-- NUEVA: Campo numero_asiento en accounting_entries
ALTER TABLE accounting_entries ADD COLUMN numero_asiento VARCHAR(15);
-- El numero_asiento se genera como AS-YYYY-MM-NNNN

-- NUEVA: Campo periodo_id en accounting_entries
ALTER TABLE accounting_entries ADD COLUMN periodo_id BIGINT REFERENCES periodo_contable(id);
```

## Archivos Clave en el Proyecto

| Archivo | Rol |
|---------|-----|
| `AccountingService.java` | Toda la lógica contable core: CRUD, auto-generación, reportes |
| `AccountingController.java` | Endpoints REST |
| `AccountCatalog.java` | Entidad JPA del catálogo |
| `AccountingEntry.java` | Entidad JPA del asiento |
| `AccountingEntryItem.java` | Entidad JPA del detalle |
| `SaleService.java` | Llama a autoGenerateFromSale |
| `PaymentService.java` | Llama a autoGenerateFromPayment |
| `AccountingView.tsx` | Frontend del módulo |
| `schema.sql` | DDL de tablas |
| `data.sql` | Seed data |

## Prioridad de Implementación para Módulo Auditable

1. **Períodos contables** — base de todo, sin períodos no hay control de fechas
2. **Numeración correlativa** — requisito de auditoría básico
3. **Asiento de apertura** — para que los saldos iniciales sean reales
4. **ISV en ventas** — obligación fiscal, genera multas si no se registra
5. **Costo de ventas automático** — sin esto el estado de resultados no refleja la realidad
6. **Reversiones en vez de DELETE** — pista de auditoría
7. **Integridad de fechas** — validación contra períodos
8. **Asientos de cierre** — cierre mensual y anual
