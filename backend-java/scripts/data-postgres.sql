-- PostgreSQL Data Export
-- Generated from sql.js: C:\Users\pc\Desktop\soluciones\data\patron-prod.db

-- users (4 rows)
INSERT INTO users (id, nombre, correo, contrasena, rol, activo) VALUES ('USR-0001', 'Xd3u5', 'Xd3u5@elpatron.hn', '$2b$10$p3qb1415mh9ySWG8N6RDlO2e4odI3DgqrMvDpstFDXI8RgwJOChTC', 'Admin', 1);
INSERT INTO users (id, nombre, correo, contrasena, rol, activo) VALUES ('USR-0002', 'Carlos Sosa', 'vendedor@elpatron.hn', '$2b$10$c5akRVY2No/xp2DlJNzUWOAqvjbdqmP7Dt4.9oqNizLBcL7uEpzq6', 'Vendedor', 1);
INSERT INTO users (id, nombre, correo, contrasena, rol, activo) VALUES ('USR-0003', 'Pedro Ramírez', 'produccion@elpatron.hn', '$2b$10$cdLdkkf4aqBoGOc6ljxGhOZIHU7Ntd0aAghSktDfSnXlDOFWdYVNC', 'Produccion', 1);
INSERT INTO users (id, nombre, correo, contrasena, rol, activo) VALUES ('USR-0004', 'Lucía Mendoza', 'analista@elpatron.hn', '$2b$10$VmTrntdxMbleJ0gD.pxrJO9TIhzGS59BW6/r7FCbVW.eZJ/R8F/.2', 'Analista', 1);

-- providers (3 rows)
INSERT INTO providers (id, nombre, contacto, telefono, email, observaciones) VALUES ('PRV0001', 'Distribuidora Plastiglas S.A.', 'Lic. Mario Espinal', '+504 2551-8080', 'mespinal@plastiglashn.com', 'Principal proveedor de planchas acrílicas.');
INSERT INTO providers (id, nombre, contacto, telefono, email, observaciones) VALUES ('PRV0002', 'Metales Especiales Sula', 'Ing. Gustavo Ferrera', '+504 2564-1122', 'ventas@metales-sula.com', 'Provee aceros, aluminios y perfiles.');
INSERT INTO providers (id, nombre, contacto, telefono, email, observaciones) VALUES ('PRV0003', 'Promocionales Latinoamericanos', 'Karla Duarte', '+504 9874-3321', 'kduarte@promocon.com', 'Importación de termos.');

-- products (5 rows)
INSERT INTO products (id, nombre, categoria, stock_inicial, entradas, salidas, stock_actual, precio_costo, precio_venta, observaciones, material, proveedor_id, alerta_stock) VALUES ('PRD0001', 'Lámina Acrílico Cristal 3mm (1.22x2.44m)', 'Materia Prima', 25, 5, 12, 18, 850, 1650, 'Acrílico de alta transparencia.', 'Empresa lo Provee', 'PRV0001', 5);
INSERT INTO products (id, nombre, categoria, stock_inicial, entradas, salidas, stock_actual, precio_costo, precio_venta, observaciones, material, proveedor_id, alerta_stock) VALUES ('PRD0002', 'Lámina Acrílico Negro 3mm (1.22x2.44m)', 'Materia Prima', 15, 0, 12, 3, 920, 1800, 'Ideal para letreros luminosos.', 'Empresa lo Provee', 'PRV0001', 5);
INSERT INTO products (id, nombre, categoria, stock_inicial, entradas, salidas, stock_actual, precio_costo, precio_venta, observaciones, material, proveedor_id, alerta_stock) VALUES ('PRD0003', 'Termo Metálico Térmico 500ml', 'Producto Final', 100, 50, 65, 85, 120, 320, 'Termo de acero inoxidable.', 'Empresa lo Provee', 'PRV0003', 15);
INSERT INTO products (id, nombre, categoria, stock_inicial, entradas, salidas, stock_actual, precio_costo, precio_venta, observaciones, material, proveedor_id, alerta_stock) VALUES ('PRD0004', 'Placa Acero Inoxidable 1mm (1x1m)', 'Materia Prima', 10, 2, 4, 8, 2400, 4100, 'Corte láser de fibra.', 'Empresa lo Provee', 'PRV0002', 3);
INSERT INTO products (id, nombre, categoria, stock_inicial, entradas, salidas, stock_actual, precio_costo, precio_venta, observaciones, material, proveedor_id, alerta_stock) VALUES ('PRD0005', 'Lámina MDF Premium 9mm (1.83x2.44m)', 'Materia Prima', 35, 10, 24, 21, 410, 850, 'MDF densidad homogénea.', 'Empresa lo Provee', 'PRV0002', 8);

-- clients (5 rows)
INSERT INTO clients (id, nombre, telefono, email, estado, observaciones, clasificacion, fecha_registro, ltv, rfm_score, departamento, ciudad) VALUES ('CLI0001', 'Corporación Inmobiliaria del Norte S.A.', '+504 2552-1400', 'compras@inmobnorte.hn', 'Activo', 'Cliente Premium. Letreros monumentales.', 'VIP', '10/06/2026', 18500, 9, 'Cortés', 'San Pedro Sula');
INSERT INTO clients (id, nombre, telefono, email, estado, observaciones, clasificacion, fecha_registro, ltv, rfm_score, departamento, ciudad) VALUES ('CLI0002', 'Publicidad Creativa HN', '+504 9481-2233', 'diseno@publicreativa.hn', 'Activo', 'Agencia de marketing recurrente.', 'Frecuente', '15/06/2026', 9400, 8, 'Francisco Morazán', 'Tegucigalpa');
INSERT INTO clients (id, nombre, telefono, email, estado, observaciones, clasificacion, fecha_registro, ltv, rfm_score, departamento, ciudad) VALUES ('CLI0003', 'Artesanías y Recuerdos Copán', '+504 2651-4040', 'info@recuerdoscopan.com', 'Activo', 'Diseños en madera y acrílicos.', 'Frecuente', '18/06/2026', 6850, 7, 'Copán', 'Copán Ruinas');
INSERT INTO clients (id, nombre, telefono, email, estado, observaciones, clasificacion, fecha_registro, ltv, rfm_score, departamento, ciudad) VALUES ('CLI0004', 'Asociación Industrial Sula', '+504 2566-9090', 'mantenimiento@industriasula.hn', 'Activo', 'Facturas corporativas.', 'Nuevo', '12/06/2026', 4500, 5, 'Cortés', 'Choloma');
INSERT INTO clients (id, nombre, telefono, email, estado, observaciones, clasificacion, fecha_registro, ltv, rfm_score, departamento, ciudad) VALUES ('CLI0005', 'Inversiones y Servicios Gómez', '+504 9901-2200', 'gomezservicios@gmail.com', 'Activo', 'Compras pendientes de pago.', 'Deudor', '01/06/2026', 1200, 4, 'Atlántida', 'La Ceiba');

-- sales (6 rows)
INSERT INTO sales (id, fecha, cliente_id, cliente, producto_id, producto, tipo_trabajo, precio, estado, pago_inicial, estado_pago, observaciones, vendedor_id, material) VALUES ('VNT0001', '12/06/2026', 'CLI0001', 'Corporación Inmobiliaria del Norte S.A.', 'PRD0001', 'Lámina Acrílico Cristal 3mm', 'Corte CO2', 12500, 'Terminado', 12500, 'Pagado', 'Corte de letras en relieve.', 'USR-0001', 'Empresa lo Provee');
INSERT INTO sales (id, fecha, cliente_id, cliente, producto_id, producto, tipo_trabajo, precio, estado, pago_inicial, estado_pago, observaciones, vendedor_id, material) VALUES ('VNT0002', '14/06/2026', 'CLI0002', 'Publicidad Creativa HN', 'PRD0003', 'Termo Metálico Térmico 500ml', 'Grabado Fibra', 9400, 'En proceso', 5000, 'Pendiente', 'Lote de 30 termos.', 'USR-0002', 'Empresa lo Provee');
INSERT INTO sales (id, fecha, cliente_id, cliente, producto_id, producto, tipo_trabajo, precio, estado, pago_inicial, estado_pago, observaciones, vendedor_id, material) VALUES ('VNT0003', '16/06/2026', 'CLI0003', 'Artesanías y Recuerdos Copán', 'PRD0005', 'Lámina MDF Premium 9mm', 'Corte CO2', 6850, 'En proceso', 3500, 'Pendiente', '200 souvenirs turísticos.', 'USR-0002', 'Empresa lo Provee');
INSERT INTO sales (id, fecha, cliente_id, cliente, producto_id, producto, tipo_trabajo, precio, estado, pago_inicial, estado_pago, observaciones, vendedor_id, material) VALUES ('VNT0004', '17/06/2026', 'CLI0004', 'Asociación Industrial Sula', 'PRD0004', 'Placa Acero Inoxidable 1mm', 'Corte Metal', 4500, 'Pendiente', 0, 'Pendiente', 'Placas industriales.', 'USR-0002', 'Empresa lo Provee');
INSERT INTO sales (id, fecha, cliente_id, cliente, producto_id, producto, tipo_trabajo, precio, estado, pago_inicial, estado_pago, observaciones, vendedor_id, material) VALUES ('VNT0005', '18/06/2026', 'CLI0005', 'Inversiones y Servicios Gómez', '', 'Servicio de Grabado Personalizado', 'Otro', 1200, 'Pendiente', 0, 'Pendiente', 'Grabado de trofeo de vidrio.', 'USR-0002', 'Cliente lo Trae');
INSERT INTO sales (id, fecha, cliente_id, cliente, producto_id, producto, tipo_trabajo, precio, estado, pago_inicial, estado_pago, observaciones, vendedor_id, material) VALUES ('VNT0006', '2026-07-11', 'CLI0001', 'Corporación Inmobiliaria del Norte S.A.', '', 'Servicio', 'Grabado Láser en Columnas de Acero', 4500, 'Pendiente', 0, 'Pendiente', 'Convertido de Cotización COT0001', 'USR-0001', 'Empresa lo Provee');

-- payments (4 rows)
INSERT INTO payments (id, venta_id, cliente_id, cliente, fecha, monto, metodo, estado, observaciones, registrado_por) VALUES ('PAG0001', 'VNT0001', 'CLI0001', 'Corporación Inmobiliaria del Norte S.A.', '12/06/2026', 12500, 'Transferencia', 'Pagado', 'Pago de contado.', 'USR-0001');
INSERT INTO payments (id, venta_id, cliente_id, cliente, fecha, monto, metodo, estado, observaciones, registrado_por) VALUES ('PAG0002', 'VNT0002', 'CLI0002', 'Publicidad Creativa HN', '14/06/2026', 5000, 'Tarjeta', 'Pendiente', 'Anticipo 50%.', 'USR-0002');
INSERT INTO payments (id, venta_id, cliente_id, cliente, fecha, monto, metodo, estado, observaciones, registrado_por) VALUES ('PAG0003', 'VNT0003', 'CLI0003', 'Artesanías y Recuerdos Copán', '16/06/2026', 3500, 'Efectivo', 'Pendiente', 'Abono inicial.', 'USR-0002');
INSERT INTO payments (id, venta_id, cliente_id, cliente, fecha, monto, metodo, estado, observaciones, registrado_por) VALUES ('PAG0004', 'VNT0004', 'CLI0004', 'Asociación Industrial Sula', '10/7/2026', 4500, 'Efectivo', 'Pagado', 'Pago registrado vía panel de cobranza.', 'USR-0001');

-- interactions (2 rows)
INSERT INTO interactions (id, cliente_id, cliente, fecha, tipo, resultado, observaciones) VALUES ('INT0001', 'CLI0001', 'Corporación Inmobiliaria del Norte S.A.', '10/06/2026', 'Llamada', 'Presupuesto Aprobado', 'Aprueba diseño letras 3D.');
INSERT INTO interactions (id, cliente_id, cliente, fecha, tipo, resultado, observaciones) VALUES ('INT0002', 'CLI0002', 'Publicidad Creativa HN', '14/06/2026', 'WhatsApp', 'Seña Enviada', 'Muestra digital aprobada.');

-- reminders (2 rows)
INSERT INTO reminders (id, cliente_id, cliente, fecha, descripcion, prioridad, completado) VALUES ('REM0001', 'CLI0002', 'Publicidad Creativa HN', '22/06/2026', 'Notificar finalización y cobrar saldo.', 'Alta', 'FALSE');
INSERT INTO reminders (id, cliente_id, cliente, fecha, descripcion, prioridad, completado) VALUES ('REM0002', 'CLI0005', 'Inversiones y Servicios Gómez', '25/06/2026', 'Recordatorio formal de abono.', 'Media', 'FALSE');

-- stock_logs (2 rows)
INSERT INTO stock_logs (id, producto_id, producto, fecha, tipo, cantidad, costo_unitario, costo_total, referencia, usuario) VALUES ('MOV0001', 'PRD0001', 'Lámina Acrílico Cristal 3mm', '10/06/2026', 'entrada', 5, 850, 4250, 'Factura #784', 'USR-0001');
INSERT INTO stock_logs (id, producto_id, producto, fecha, tipo, cantidad, costo_unitario, costo_total, referencia, usuario) VALUES ('MOV0002', 'PRD0001', 'Lámina Acrílico Cristal 3mm', '12/06/2026', 'salida', 12, 850, 10200, 'Corte VNT0001', 'USR-0003');

-- quotations (2 rows)
INSERT INTO quotations (id, fecha, cliente_id, cliente, items, precio_total, descuento, isv, estado, observaciones, vendedor_id) VALUES ('COT0001', '2026-07-10', 'CLI0001', 'Corporación Inmobiliaria del Norte S.A.', '[{"tipoTrabajo":"Grabado Láser en Columnas de Acero","precio":4500},{"tipoTrabajo":"Corte de Letras en Acrílico 3mm","precio":1800}]', 6350, 0, 15, 'Pendiente', 'Sujeta a aprobación.', 'USR-0001');
INSERT INTO quotations (id, fecha, cliente_id, cliente, items, precio_total, descuento, isv, estado, observaciones, vendedor_id) VALUES ('COT0002', '2026-07-10', 'CLI0002', 'Inversiones Turísticas de Copán', '[{"tipoTrabajo":"Grabado de Termos Térmicos Colectivos","precio":3200}]', 3200, 0, 15, 'Convertido', 'Convertido a venta.', 'USR-0002');

-- production_tasks (1 rows)
INSERT INTO production_tasks (id, venta_id, cliente_id, cliente, descripcion, tipo, estado, creado_en, completado_en, vendedor_id) VALUES ('5fed7dda', 'VNT0006', 'CLI0001', 'Corporación Inmobiliaria del Norte S.A.', 'Grabado Láser en Columnas de Acero', 'Grabado Láser en Columnas de Acero', 'Pendiente', '2026-07-11', NULL, 'USR-0001');

