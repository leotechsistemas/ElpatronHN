-- PostgreSQL Schema for EL PATRÓN ERP
-- Generated from sql.js schema (server/db.cjs)

DROP TABLE IF EXISTS production_tasks CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS stock_logs CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    contrasena TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('Admin','Vendedor','Produccion','Analista')),
    activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    email TEXT,
    observaciones TEXT
);

CREATE TABLE products (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    stock_inicial INTEGER NOT NULL,
    entradas INTEGER NOT NULL DEFAULT 0,
    salidas INTEGER NOT NULL DEFAULT 0,
    stock_actual INTEGER NOT NULL,
    precio_costo REAL NOT NULL,
    precio_venta REAL NOT NULL,
    observaciones TEXT,
    material TEXT,
    proveedor_id TEXT,
    alerta_stock INTEGER NOT NULL
);

CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    estado TEXT NOT NULL CHECK (estado IN ('Activo','Inactivo')),
    observaciones TEXT,
    clasificacion TEXT NOT NULL CHECK (clasificacion IN ('Nuevo','Frecuente','VIP','Deudor')),
    fecha_registro TEXT NOT NULL,
    ltv REAL NOT NULL DEFAULT 0,
    rfm_score INTEGER NOT NULL DEFAULT 5,
    departamento TEXT,
    ciudad TEXT
);

CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    fecha TEXT NOT NULL,
    cliente_id TEXT NOT NULL,
    cliente TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    producto TEXT NOT NULL,
    tipo_trabajo TEXT NOT NULL,
    precio REAL NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('Pendiente','En proceso','Terminado')),
    pago_inicial REAL NOT NULL,
    estado_pago TEXT NOT NULL CHECK (estado_pago IN ('Pendiente','Pagado')),
    observaciones TEXT,
    vendedor_id TEXT
);

CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    venta_id TEXT NOT NULL,
    cliente_id TEXT NOT NULL,
    cliente TEXT NOT NULL,
    fecha TEXT NOT NULL,
    monto REAL NOT NULL,
    metodo TEXT NOT NULL CHECK (metodo IN ('Efectivo','Tarjeta','Transferencia','')),
    estado TEXT NOT NULL CHECK (estado IN ('Pendiente','Pagado','Anulado')),
    observaciones TEXT,
    registrado_por TEXT
);

CREATE TABLE interactions (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL,
    cliente TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Llamada','WhatsApp','Email','Visita')),
    resultado TEXT NOT NULL,
    observaciones TEXT
);

CREATE TABLE reminders (
    id TEXT PRIMARY KEY,
    cliente_id TEXT,
    cliente TEXT,
    fecha TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    prioridad TEXT CHECK (prioridad IN ('Alta','Media','Baja')),
    completado TEXT NOT NULL DEFAULT 'FALSE'
);

CREATE TABLE stock_logs (
    id TEXT PRIMARY KEY,
    producto_id TEXT NOT NULL,
    producto TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada','salida')),
    cantidad INTEGER NOT NULL,
    costo_unitario REAL,
    costo_total REAL,
    referencia TEXT,
    usuario TEXT
);

CREATE TABLE quotations (
    id TEXT PRIMARY KEY,
    fecha TEXT NOT NULL,
    cliente_id TEXT NOT NULL,
    cliente TEXT NOT NULL,
    items TEXT NOT NULL,
    precio_total REAL NOT NULL,
    descuento REAL NOT NULL DEFAULT 0,
    isv REAL NOT NULL DEFAULT 15,
    estado TEXT NOT NULL CHECK (estado IN ('Pendiente','Convertido')),
    observaciones TEXT,
    vendedor_id TEXT
);

CREATE TABLE production_tasks (
    id TEXT PRIMARY KEY,
    venta_id TEXT NOT NULL,
    cliente_id TEXT NOT NULL,
    cliente TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    creado_en TEXT NOT NULL,
    completado_en TEXT,
    vendedor_id TEXT
);
