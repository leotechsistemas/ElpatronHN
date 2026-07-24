$baseUrl = "http://localhost:8080"

# Login
$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"Xd3u5@elpatron.hn","password":"admin"}' -UseBasicParsing
$token = $login.token
$headers = @{"Authorization"="Bearer $token"; "Content-Type"="application/json"}
Write-Output "Login OK: $($token.Substring(0,20))..."

# ─── PRODUCTOS ────────────────────────────────────────────
$products = @(
    @{ nombre="Lona Impresa 1m²"; categoria="Impresión"; stockInicial=500; stockActual=500; precioCosto=20; precioVenta=60; material="Lona"; alertaStock=50; observaciones="Impresión full color, 720dpi" },
    @{ nombre="Lona Impresa 2m²"; categoria="Impresión"; stockInicial=300; stockActual=300; precioCosto=38; precioVenta=110; material="Lona"; alertaStock=30; observaciones="Impresión full color, 720dpi" },
    @{ nombre="Vinil Adhesivo 1m²"; categoria="Impresión"; stockInicial=400; stockActual=400; precioCosto=15; precioVenta=45; material="Vinil"; alertaStock=40; observaciones="Vinil autoadhesivo mate" },
    @{ nombre="Vinil Adhesivo 2m²"; categoria="Impresión"; stockInicial=200; stockActual=200; precioCosto=28; precioVenta=85; material="Vinil"; alertaStock=20; observaciones="Vinil autoadhesivo mate" },
    @{ nombre="Tarjetas de Presentación (100 uds)"; categoria="Papelería"; stockInicial=200; stockActual=200; precioCosto=35; precioVenta=120; material="Cartulina 300gr"; alertaStock=30; observaciones="Full color ambos lados, barniz UV" },
    @{ nombre="Tarjetas de Presentación (500 uds)"; categoria="Papelería"; stockInicial=100; stockActual=100; precioCosto=120; precioVenta=350; material="Cartulina 300gr"; alertaStock=15; observaciones="Full color ambos lados, barniz UV" },
    @{ nombre="Flyers Volantes 1/4 Carta (1000 uds)"; categoria="Papelería"; stockInicial=150; stockActual=150; precioCosto=180; precioVenta=500; material="Papel Couche 150gr"; alertaStock=20; observaciones="Full color ambas caras" },
    @{ nombre="Flyers Volantes 1/2 Carta (1000 uds)"; categoria="Papelería"; stockInicial=100; stockActual=100; precioCosto=300; precioVenta=800; material="Papel Couche 150gr"; alertaStock=15; observaciones="Full color ambas caras" },
    @{ nombre="Brochures Trípticos (500 uds)"; categoria="Papelería"; stockInicial=80; stockActual=80; precioCosto=400; precioVenta=1200; material="Papel Couche 200gr"; alertaStock=10; observaciones="Doblado incluido, full color" },
    @{ nombre="Catálogos 20 páginas (100 uds)"; categoria="Papelería"; stockInicial=50; stockActual=50; precioCosto=1200; precioVenta=3200; material="Papel Couche 200gr"; alertaStock=5; observaciones="Encuadernación grapada, full color" },
    @{ nombre="Stickers Troquelados 5cm (500 uds)"; categoria="Rotulación"; stockInicial=300; stockActual=300; precioCosto=80; precioVenta=250; material="Vinil Troquelado"; alertaStock=30; observaciones="Corte por silueta" },
    @{ nombre="Stickers Troquelados 10cm (200 uds)"; categoria="Rotulación"; stockInicial=200; stockActual=200; precioCosto=120; precioVenta=350; material="Vinil Troquelado"; alertaStock=20; observaciones="Corte por silueta o troquel" },
    @{ nombre="Rótulo Luminoso LED 40x60cm"; categoria="Rotulación"; stockInicial=20; stockActual=20; precioCosto=600; precioVenta=1800; material="Acrílico + LED"; alertaStock=5; observaciones="Incluye fuente de poder" },
    @{ nombre="Rótulo Troquelado 30x50cm"; categoria="Rotulación"; stockInicial=30; stockActual=30; precioCosto=250; precioVenta=750; material="Aluminio"; alertaStock=5; observaciones="Tornillos de fijación incluidos" },
    @{ nombre="Letras Corporeas 10cm c/u"; categoria="Rotulación"; stockInicial=100; stockActual=100; precioCosto=40; precioVenta=120; material="Acrílico"; alertaStock=15; observaciones="Por letra individual" },
    @{ nombre="Sublimación Taza 11oz"; categoria="Sublimación"; stockInicial=200; stockActual=200; precioCosto=25; precioVenta=70; material="Cerámica"; alertaStock=30; observaciones="Taza blanca poliéster 11oz" },
    @{ nombre="Sublimación Camiseta Poliéster"; categoria="Sublimación"; stockInicial=150; stockActual=150; precioCosto=40; precioVenta=120; material="Tela Poliéster"; alertaStock=20; observaciones="Talla única, full color" },
    @{ nombre="Sublimación Gorra"; categoria="Sublimación"; stockInicial=80; stockActual=80; precioCosto=35; precioVenta=100; material="Tela Poliéster"; alertaStock=10; observaciones="Gorra ajustable, full color" },
    @{ nombre="Sublimación Rompecabezas"; categoria="Sublimación"; stockInicial=60; stockActual=60; precioCosto=50; precioVenta=150; material="Cartón 2mm"; alertaStock=8; observaciones="Rompecabezas 30 piezas" },
    @{ nombre="Corte Láser Acrílico 3mm (60x90cm)"; categoria="Corte Láser"; stockInicial=50; stockActual=50; precioCosto=30; precioVenta=90; material="Acrílico"; alertaStock=10; observaciones="Lámina completa, incluye corte" },
    @{ nombre="Corte Láser MDF 3mm (60x90cm)"; categoria="Corte Láser"; stockInicial=40; stockActual=40; precioCosto=20; precioVenta=65; material="MDF"; alertaStock=8; observaciones="Lámina completa, incluye corte" },
    @{ nombre="Grabado Láser Metal 10x10cm"; categoria="Grabado"; stockInicial=100; stockActual=100; precioCosto=8; precioVenta=35; material="Metal"; alertaStock=15; observaciones="Por pieza individual" },
    @{ nombre="Grabado Láser Vidrio 15x15cm"; categoria="Grabado"; stockInicial=60; stockActual=60; precioCosto=15; precioVenta=50; material="Vidrio"; alertaStock=10; observaciones="Por pieza individual" },
    @{ nombre="Placa Metálica Grabada 20x30cm"; categoria="Grabado"; stockInicial=40; stockActual=40; precioCosto=60; precioVenta=200; material="Aluminio"; alertaStock=5; observaciones="Acabado cepillado" },
    @{ nombre="Imán Publicitario 5x5cm (200 uds)"; categoria="Promocionales"; stockInicial=300; stockActual=300; precioCosto=60; precioVenta=180; material="Imán Flexible"; alertaStock=30; observaciones="Full color con laminado" },
    @{ nombre="Bolígrafos Personalizados (100 uds)"; categoria="Promocionales"; stockInicial=200; stockActual=200; precioCosto=80; precioVenta=250; material="Plástico"; alertaStock=20; observaciones="Estampado 1 color" },
    @{ nombre="Llavero Acrílico Grabado"; categoria="Promocionales"; stockInicial=150; stockActual=150; precioCosto=10; precioVenta=35; material="Acrílico"; alertaStock=20; observaciones="Incluye argolla metálica" },
    @{ nombre="Pendón Roll-Up 85x200cm"; categoria="Impresión"; stockInicial=25; stockActual=25; precioCosto=350; precioVenta=950; material="Lona + Mecanismo"; alertaStock=5; observaciones="Incluye base retráctil y estuche" },
    @{ nombre="Valla Publicitaria 2x1m²"; categoria="Impresión"; stockInicial=15; stockActual=15; precioCosto=500; precioVenta=1500; material="Lona pesada"; alertaStock=3; observaciones="Ojalillos y refuerzo de bordes" },
    @{ nombre="Carpeta Corporativa (50 uds)"; categoria="Papelería"; stockInicial=80; stockActual=80; precioCosto=300; precioVenta=900; material="Cartulina couche"; alertaStock=10; observaciones="Bolsa plastica personalizada incl." }
)

$created = 0
foreach ($p in $products) {
    try {
        $body = $p | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method POST -Headers $headers -Body $body -UseBasicParsing
        $created++
        Write-Output "  [$created] OK $($p.nombre)"
    } catch {
        Write-Output "  ERROR $($p.nombre): $_"
    }
}
Write-Output "Productos creados: $created / $($products.Count)"

# ─── CLIENTES ────────────────────────────────────────────
$departamentos = @(
    "Cortés", "Francisco Morazán", "Atlántida", "Yoro", "Olancho", "Colón",
    "Gracias a Dios", "El Paraíso", "Choluteca", "Valle", "La Paz", "Intibucá",
    "Lempira", "Ocotepeque", "Copán", "Santa Bárbara", "Comayagua", "Islas de la Bahía"
)

$nombres = @(
    "Carlos Mendoza", "María López", "José García", "Ana Martínez", "Luis Hernández",
    "Sofía Rodríguez", "Pedro Sánchez", "Elena Ramírez", "Jorge Torres", "Diana Flores",
    "Roberto Castro", "Verónica Morales", "Fernando Ortiz", "Gabriela Ruiz", "Manuel Aguilar",
    "Patricia Vargas", "Ricardo Herrera", "Adriana Soto", "Andrés Peña", "Mónica Rivas",
    "Héctor Guzmán", "Lorena Méndez", "Sergio Navarro", "Carolina Delgado", "Oscar Vega",
    "Natalia Campos", "Diego Paredes", "Ximena Rojas", "Alberto Sandoval", "Marcela Núñez",
    "Eduardo Rivera", "Daniela Luna", "Miguel Ángel Mora", "Paola Carmona", "Francisco Jiménez",
    "Claudia Medina", "Alejandro Salazar", "Silvia Escobar", "Rafael Cáceres", "Tania Zavala",
    "Julio Garay", "Rosa Peralta", "Vicente Ibarra", "Martha Cueva", "Cristian Machado",
    "Lidia Padilla", "Enrique Solís", "Maritza Villeda", "Mario Arriaga", "Esther Bonilla",
    "Humberto Guevara", "Sandra Ponce", "Rolando Alvarado", "Margarita Cabrera", "Armando Maldonado",
    "Karla Ordoñez", "Wilfredo Bustamante", "Ruth Godoy", "Erick Landaverde", "Olga Cerrato"
)

$apellidosRTN = @(
    "García", "Martínez", "López", "Hernández", "González",
    "Pérez", "Rodríguez", "Sánchez", "Ramírez", "Cruz",
    "Flores", "Morales", "Ortiz", "Ruiz", "Aguilar",
    "Vargas", "Herrera", "Soto", "Peña", "Rivas"
)

$clientesCreados = 0
$totalClientes = $departamentos.Count * 10
Write-Output "Creando $totalClientes clientes ($($departamentos.Count) deptos x 10)..."

foreach ($dept in $departamentos) {
    $ciudades = switch ($dept) {
        "Cortés"               { @("San Pedro Sula", "Choloma", "Puerto Cortés", "Villanueva", "La Lima") }
        "Francisco Morazán"    { @("Tegucigalpa", "Comayagüela", "Talanga", "Valle de Ángeles", "Santa Lucía") }
        "Atlántida"            { @("La Ceiba", "Tela", "Esparta", "Jutiapa", "El Porvenir") }
        "Yoro"                 { @("Yoro", "El Progreso", "Olanchito", "Santa Rita", "Jocón") }
        "Olancho"              { @("Juticalpa", "Catacamas", "San Francisco de Becerra", "Patuca", "Campamento") }
        "Colón"                { @("Trujillo", "Tocoa", "Bonito Oriental", "Limón", "Santa Rosa de Aguán") }
        "Gracias a Dios"       { @("Puerto Lempira", "Ahuas", "Brus Laguna", "Wampusirpe", "Juan Francisco Bulnes") }
        "El Paraíso"           { @("Danlí", "El Paraíso", "Yuscaran", "Jinotepe", "Trojes") }
        "Choluteca"            { @("Choluteca", "Pespire", "El Triunfo", "San Marcos de Colón", "Ciudad Choluteca") }
        "Valle"                { @("Nacaome", "San Francisco de Coray", "Amapala", "Langue", "Goascorán") }
        "La Paz"               { @("La Paz", "Marcala", "San José", "Lepáguare", "Cabañas") }
        "Intibucá"             { @("La Esperanza", "Intibucá", "Jesús de Otoro", "San Miguelito", "San Isidro") }
        "Lempira"              { @("Gracias", "Cololaca", "Tambla", "La Unión", "Tomatalá") }
        "Ocotepeque"           { @("Ocotepeque", "San Marcos", "Sinuapa", "Concepción", "La Encarnación") }
        "Copán"                { @("Santa Rosa de Copán", "Copán Ruinas", "Corquín", "Dulce Nombre", "Florida") }
        "Santa Bárbara"        { @("Santa Bárbara", "Quimistán", "Trinidad", "Macuelizo", "San Luis") }
        "Comayagua"            { @("Comayagua", "Siguatepeque", "La Libertad", "Taulabé", "Ajuterique") }
        "Islas de la Bahía"    { @("Roatán", "Utila", "Guanaja", "Santos Guardiola", "French Harbour") }
    }

    # Pick 5 unique random RTN's for this department (con RTN)
    $rtnsUsed = @()
    for ($i = 0; $i -lt 5; $i++) {
        $apellido = $apellidosRTN | Get-Random
        $r = "0801-"
        $r += (Get-Random -Minimum 1990 -Maximum 2005).ToString()
        $r += (Get-Random -Minimum 10000 -Maximum 99999).ToString("00000")
        # Ensure uniqueness
        while ($rtnsUsed -contains $r) {
            $r = "0801-" + (Get-Random -Minimum 1990 -Maximum 2005).ToString() + (Get-Random -Minimum 10000 -Maximum 99999).ToString("00000")
        }
        $rtnsUsed += $r

        $name = "$apellido $($nombres[(Get-Random -Minimum 0 -Maximum ($nombres.Length-1))])"
        $ciudad = $ciudades[(Get-Random -Minimum 0 -Maximum ($ciudades.Length-1))]
        $tel = "+504 9" + (Get-Random -Minimum 10000000 -Maximum 99999999).ToString()
        $email = ("cliente" + $clientesCreados + "@elpatron.hn").ToLower()

        $body = @{
            nombre = $name
            telefono = $tel
            email = $email
            departamento = $dept
            ciudad = $ciudad
            rtn = $r
            clasificacion = if ($i -lt 2) { "VIP" } else { "Regular" }
            estado = "Activo"
        } | ConvertTo-Json

        try {
            Invoke-RestMethod -Uri "$baseUrl/api/clients" -Method POST -Headers $headers -Body $body -UseBasicParsing | Out-Null
            $clientesCreados++
        } catch { Write-Output "  ERROR ($dept RTN): $_" }
    }

    # 5 sin RTN
    for ($i = 0; $i -lt 5; $i++) {
        $name = $nombres[(Get-Random -Minimum 0 -Maximum ($nombres.Length-1))]
        $ciudad = $ciudades[(Get-Random -Minimum 0 -Maximum ($ciudades.Length-1))]
        $tel = "+504 3" + (Get-Random -Minimum 10000000 -Maximum 99999999).ToString()
        $email = ("cliente" + $clientesCreados + "@elpatron.hn").ToLower()

        $body = @{
            nombre = $name
            telefono = $tel
            email = $email
            departamento = $dept
            ciudad = $ciudad
            rtn = ""
            clasificacion = "Regular"
            estado = "Activo"
        } | ConvertTo-Json

        try {
            Invoke-RestMethod -Uri "$baseUrl/api/clients" -Method POST -Headers $headers -Body $body -UseBasicParsing | Out-Null
            $clientesCreados++
        } catch { Write-Output "  ERROR ($dept noRTN): $_" }
    }
}

Write-Output "Clientes creados: $clientesCreados / $totalClientes"
Write-Output "=== SEED COMPLETADO ==="
