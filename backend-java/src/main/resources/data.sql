-- Seed data for EL PATRON HN ERP
-- Users are created by DataInitializer.java

-- Account Catalog (ids = codigos so findCuentaByCodigo works)
INSERT INTO account_catalog (id, codigo, nombre, tipo, nivel, acepta_asientos, padre_id, activo) VALUES
('1', '1', 'Activos', 'Activo', 1, false, null, true),
('1.1', '1.1', 'Activo Circulante', 'Activo', 2, false, '1', true),
('1.1.1', '1.1.1', 'Caja', 'Activo', 3, true, '1.1', true),
('1.1.2', '1.1.2', 'Bancos', 'Activo', 3, true, '1.1', true),
('1.1.3', '1.1.3', 'Cuentas por Cobrar', 'Activo', 3, true, '1.1', true),
('1.1.4', '1.1.4', 'Inventario', 'Activo', 3, true, '1.1', true),
('2', '2', 'Pasivos', 'Pasivo', 1, false, null, true),
('2.1', '2.1', 'Pasivo Circulante', 'Pasivo', 2, false, '2', true),
('2.1.1', '2.1.1', 'Impuestos por Pagar', 'Pasivo', 3, true, '2.1', true),
('3', '3', 'Patrimonio', 'Patrimonio', 1, false, null, true),
('3.1.1', '3.1.1', 'Capital', 'Patrimonio', 3, true, '3', true),
('4', '4', 'Ingresos', 'Ingreso', 1, false, null, true),
('4.1.1', '4.1.1', 'Ventas', 'Ingreso', 3, true, '4', true),
('5', '5', 'Gastos', 'Gasto', 1, false, null, true),
('5.1.1', '5.1.1', 'Costo de Ventas', 'Gasto', 3, true, '5', true),
('5.1.2', '5.1.2', 'Gastos Operativos', 'Gasto', 3, true, '5', true);

-- Periodo Contable (current year 2026)
INSERT INTO periodo_contable (id, codigo, fecha_inicio, fecha_fin, cerrado) VALUES
(1, '2026-01', '2026-01-01', '2026-12-31', false);

-- Service Types (used by POS)
INSERT INTO service_types (id, nombre, descripcion, precio_sugerido, icono, activo) VALUES
('ST-0001', 'Corte Laser', 'Corte con máquina láser', 50000, '✂️', true),
('ST-0002', 'Laser CO2', 'Grabado y corte con CO2', 75000, '🔥', true),
('ST-0003', 'Router CNC', 'Corte y grabado con router CNC', 100000, '⚙️', true),
('ST-0004', 'Grabado', 'Grabado personalizado', 35000, '🖋️', true),
('ST-0005', 'Instalacion', 'Instalación de letreros y estructuras', 150000, '🔧', true),
('ST-0006', 'Diseno', 'Diseño gráfico y vectorial', 25000, '🎨', true),
('ST-0007', 'Mantenimiento', 'Mantenimiento de equipos y letreros', 80000, '🛠️', true),
('ST-0008', 'Otros', 'Otros servicios personalizados', 50000, '📦', true);

-- Company Settings
INSERT INTO company_settings (id, company_name, address, phone, email, currency, currency_symbol, slogan, rtn, logo, facebook, instagram, whatsapp, tiktok, linkedin, youtube, isv) VALUES
('SET-001', 'EL PATRON HN', 'Col. Altiplano, San Pedro Sula, Cortés', '9999-9999', 'info@patron.hn', 'HNL', 'L. ', 'Tecnología de Personalizados · Grabado Láser · Impresión · Rotulación', '08019015239084', '', '', '', '', '', '', '', 15);
