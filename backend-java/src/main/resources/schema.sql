-- PostgreSQL / H2 Schema for EL PATRÓN ERP
-- Types optimized: TEXT→VARCHAR, DATE for dates, BOOLEAN for flags, FK constraints added

DROP TABLE IF EXISTS accounting_entry_items;
DROP TABLE IF EXISTS accounting_entries;
DROP TABLE IF EXISTS account_catalog;
DROP TABLE IF EXISTS periodo_contable;
DROP TABLE IF EXISTS service_types;
DROP TABLE IF EXISTS company_settings;
DROP TABLE IF EXISTS production_tasks;
DROP TABLE IF EXISTS quotations;
DROP TABLE IF EXISTS stock_logs;
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS interactions;
DROP TABLE IF EXISTS payment_items;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS users;

CREATE TABLE service_types (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_sugerido BIGINT,
    icono VARCHAR(10) NOT NULL DEFAULT '🔧',
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE users (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('Admin','Vendedor','Produccion','Analista')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    dni VARCHAR(20),
    telefono VARCHAR(30),
    direccion VARCHAR(200),
    puesto VARCHAR(100),
    departamento VARCHAR(50),
    salario BIGINT,
    fecha_contratacion DATE,
    fecha_nacimiento DATE,
    contacto_emergencia VARCHAR(100),
    telefono_emergencia VARCHAR(30)
);

CREATE TABLE providers (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    contacto VARCHAR(150),
    telefono VARCHAR(30),
    email VARCHAR(150),
    observaciones TEXT
);

CREATE TABLE products (
    id VARCHAR(20) PRIMARY KEY,
    codigo VARCHAR(50),
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    stock_inicial INTEGER NOT NULL,
    entradas INTEGER NOT NULL DEFAULT 0,
    salidas INTEGER NOT NULL DEFAULT 0,
    stock_actual INTEGER NOT NULL,
    precio_costo BIGINT NOT NULL,
    precio_venta BIGINT NOT NULL,
    observaciones TEXT,
    material VARCHAR(50),
    proveedor_id VARCHAR(20) REFERENCES providers(id),
    alerta_stock INTEGER NOT NULL
);

CREATE TABLE clients (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    rtn VARCHAR(14),
    telefono VARCHAR(30),
    email VARCHAR(150),
    estado VARCHAR(10) NOT NULL CHECK (estado IN ('Activo','Inactivo')),
    observaciones TEXT,
    clasificacion VARCHAR(10) NOT NULL CHECK (clasificacion IN ('Nuevo','Frecuente','VIP','Deudor','Estandar')),
    fecha_registro DATE NOT NULL,
    ltv BIGINT NOT NULL DEFAULT 0,
    rfm_score INTEGER NOT NULL DEFAULT 5,
    departamento VARCHAR(50),
    ciudad VARCHAR(50)
);

CREATE TABLE sales (
    id VARCHAR(20) PRIMARY KEY,
    fecha DATE NOT NULL,
    cliente_id VARCHAR(20) NOT NULL REFERENCES clients(id),
    cliente VARCHAR(200) NOT NULL,
    rtn VARCHAR(14),
    con_rtn BOOLEAN NOT NULL DEFAULT TRUE,
    producto_id VARCHAR(20),
    producto VARCHAR(200),
    tipo_trabajo VARCHAR(100) NOT NULL,
    precio BIGINT NOT NULL,
    estado VARCHAR(15) NOT NULL CHECK (estado IN ('Pendiente','En proceso','Terminado')),
    pago_inicial BIGINT NOT NULL,
    estado_pago VARCHAR(10) NOT NULL CHECK (estado_pago IN ('Pendiente','Pagado')),
    observaciones TEXT,
    vendedor_id VARCHAR(20) REFERENCES users(id)
);

CREATE TABLE invoice_items (
    id VARCHAR(20) PRIMARY KEY,
    venta_id VARCHAR(20) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    tipo_item VARCHAR(10) NOT NULL CHECK (tipo_item IN ('PRODUCTO','SERVICIO')),
    producto_id VARCHAR(20) REFERENCES products(id),
    servicio_id VARCHAR(20) REFERENCES service_types(id),
    descripcion VARCHAR(255) NOT NULL,
    cantidad BIGINT NOT NULL DEFAULT 1,
    precio_unitario BIGINT NOT NULL,
    descuento BIGINT NOT NULL DEFAULT 0,
    isv INTEGER NOT NULL DEFAULT 15,
    subtotal BIGINT NOT NULL,
    total_linea BIGINT NOT NULL,
    CHECK (
        (tipo_item = 'PRODUCTO' AND producto_id IS NOT NULL AND servicio_id IS NULL) OR
        (tipo_item = 'SERVICIO' AND servicio_id IS NOT NULL AND producto_id IS NULL)
    )
);

CREATE TABLE payments (
    id VARCHAR(20) PRIMARY KEY,
    cliente_id VARCHAR(20) NOT NULL REFERENCES clients(id),
    cliente VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL,
    monto_total BIGINT NOT NULL,
    metodo VARCHAR(15) NOT NULL CHECK (metodo IN ('Efectivo','Tarjeta','Transferencia','')),
    estado VARCHAR(10) NOT NULL CHECK (estado IN ('Pagado')),
    observaciones TEXT,
    registrado_por VARCHAR(20) REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(20) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    venta_id VARCHAR(20) NOT NULL REFERENCES sales(id),
    monto_asignado BIGINT NOT NULL
);

CREATE TABLE interactions (
    id VARCHAR(20) PRIMARY KEY,
    cliente_id VARCHAR(20) NOT NULL REFERENCES clients(id),
    cliente VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(15) NOT NULL CHECK (tipo IN ('Llamada','WhatsApp','Email','Visita')),
    resultado VARCHAR(100) NOT NULL,
    observaciones TEXT
);

CREATE TABLE reminders (
    id VARCHAR(20) PRIMARY KEY,
    cliente_id VARCHAR(20) REFERENCES clients(id),
    cliente VARCHAR(200),
    fecha DATE NOT NULL,
    descripcion TEXT NOT NULL,
    prioridad VARCHAR(5) CHECK (prioridad IN ('Alta','Media','Baja')),
    completado BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE stock_logs (
    id VARCHAR(20) PRIMARY KEY,
    producto_id VARCHAR(20) NOT NULL REFERENCES products(id),
    producto VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada','salida')),
    cantidad INTEGER NOT NULL,
    costo_unitario BIGINT,
    costo_total BIGINT,
    referencia VARCHAR(100),
    usuario VARCHAR(20) REFERENCES users(id)
);

CREATE TABLE quotations (
    id VARCHAR(20) PRIMARY KEY,
    fecha DATE NOT NULL,
    fecha_expiracion DATE,
    cliente_id VARCHAR(20) NOT NULL REFERENCES clients(id),
    cliente VARCHAR(200) NOT NULL,
    rtn VARCHAR(14),
    con_rtn BOOLEAN NOT NULL DEFAULT TRUE,
    items TEXT NOT NULL,
    precio_total BIGINT NOT NULL,
    descuento BIGINT NOT NULL DEFAULT 0,
    isv INTEGER NOT NULL DEFAULT 15,
    estado VARCHAR(10) NOT NULL CHECK (estado IN ('Pendiente','Convertido','Vencida')),
    observaciones TEXT,
    vendedor_id VARCHAR(20) REFERENCES users(id)
);

CREATE TABLE company_settings (
    id VARCHAR(20) PRIMARY KEY,
    company_name VARCHAR(200),
    slogan VARCHAR(300),
    logo TEXT,
    currency VARCHAR(10),
    currency_symbol VARCHAR(10),
    isv INTEGER DEFAULT 15,
    phone VARCHAR(50),
    address TEXT,
    email VARCHAR(150),
    facebook VARCHAR(300),
    instagram VARCHAR(300),
    tiktok VARCHAR(300),
    whatsapp VARCHAR(300),
    youtube VARCHAR(300),
    linkedin VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS leads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    correo VARCHAR(150),
    telefono VARCHAR(30),
    empresa VARCHAR(200),
    categoria VARCHAR(50),
    descripcion TEXT,
    detalles TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    referer VARCHAR(500),
    page_url VARCHAR(500),
    cookies TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE production_tasks (
    id VARCHAR(20) PRIMARY KEY,
    venta_id VARCHAR(20) NOT NULL REFERENCES sales(id),
    cliente_id VARCHAR(20) NOT NULL REFERENCES clients(id),
    cliente VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    creado_en TIMESTAMP NOT NULL,
    inicio_en TIMESTAMP,
    completado_en TIMESTAMP,
    vendedor_id VARCHAR(20) REFERENCES users(id),
    prioridad VARCHAR(10) NOT NULL DEFAULT 'Media',
    asignado_a VARCHAR(20),
    notas_internas TEXT
);

CREATE TABLE account_catalog (
    id VARCHAR(20) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(15) NOT NULL CHECK (tipo IN ('Activo','Pasivo','Patrimonio','Ingreso','Gasto')),
    nivel INTEGER NOT NULL DEFAULT 1,
    padre_id VARCHAR(20) REFERENCES account_catalog(id),
    acepta_asientos BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE periodo_contable (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(7) NOT NULL UNIQUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    cerrado BOOLEAN NOT NULL DEFAULT FALSE,
    cerrado_por VARCHAR(20) REFERENCES users(id),
    cerrado_en TIMESTAMP
);

CREATE TABLE accounting_entries (
    id VARCHAR(20) PRIMARY KEY,
    numero_asiento VARCHAR(15) NOT NULL UNIQUE,
    fecha DATE NOT NULL,
    concepto VARCHAR(500) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Diario','Ingreso','Egreso','Traslado')),
    referencia_tipo VARCHAR(20),
    referencia_id VARCHAR(20),
    creado_por VARCHAR(20) REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_debe BIGINT NOT NULL DEFAULT 0,
    total_haber BIGINT NOT NULL DEFAULT 0,
    reversado BOOLEAN NOT NULL DEFAULT FALSE,
    periodo_id BIGINT REFERENCES periodo_contable(id)
);

CREATE TABLE accounting_entry_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asiento_id VARCHAR(20) NOT NULL REFERENCES accounting_entries(id) ON DELETE CASCADE,
    cuenta_id VARCHAR(20) NOT NULL REFERENCES account_catalog(id),
    debe BIGINT NOT NULL DEFAULT 0,
    haber BIGINT NOT NULL DEFAULT 0,
    glosa VARCHAR(500)
);

CREATE TABLE campaigns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    segmento VARCHAR(20) NOT NULL,
    canal VARCHAR(15) NOT NULL,
    plantilla VARCHAR(20) NOT NULL,
    asunto VARCHAR(300),
    mensaje TEXT NOT NULL,
    clientes_count INT NOT NULL DEFAULT 0,
    enviados_count INT NOT NULL DEFAULT 0,
    estado VARCHAR(15) NOT NULL DEFAULT 'Enviado',
    creado_por VARCHAR(20) REFERENCES users(id),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logs TEXT
);
