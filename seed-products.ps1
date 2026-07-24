$base = "http://localhost:8080"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$h = @{"Content-Type"="application/json"}
$r = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -Headers $h -Body '{"email":"Xd3u5@elpatron.hn","password":"admin"}' -UseBasicParsing
$h2 = @{"Authorization"="Bearer $($r.token)"; "Content-Type"="application/json; charset=utf-8"}

function New-Product($n, $c, $si, $sa, $pc, $pv, $m, $as) {
  $j = "{`"nombre`":`"$n`",`"categoria`":`"$c`",`"stock_inicial`":$si,`"stock_actual`":$sa,`"precio_costo`":$pc,`"precio_venta`":$pv,`"material`":`"$m`",`"alerta_stock`":$as}"
  $b = $utf8.GetBytes($j)
  try {
    Invoke-RestMethod -Uri "$base/api/products" -Method POST -Headers $h2 -Body $b -UseBasicParsing | Out-Null
    return $true
  } catch { return $false }
}

$i=0
if (New-Product "Lona Impresa 1m2" "Impresion" 500 500 20 60 "Lona" 50) { $i++ }
if (New-Product "Lona Impresa 2m2" "Impresion" 300 300 38 110 "Lona" 30) { $i++ }
if (New-Product "Vinil Adhesivo 1m2" "Impresion" 400 400 15 45 "Vinil" 40) { $i++ }
if (New-Product "Vinil Adhesivo 2m2" "Impresion" 200 200 28 85 "Vinil" 20) { $i++ }
if (New-Product "Tarjetas Presentacion 100ud" "Papeleria" 200 200 35 120 "Cartulina 300gr" 30) { $i++ }
if (New-Product "Tarjetas Presentacion 500ud" "Papeleria" 100 100 120 350 "Cartulina 300gr" 15) { $i++ }
if (New-Product "Flyers 1/4 Carta 1000ud" "Papeleria" 150 150 180 500 "Papel Couche 150gr" 20) { $i++ }
if (New-Product "Flyers 1/2 Carta 1000ud" "Papeleria" 100 100 300 800 "Papel Couche 150gr" 15) { $i++ }
if (New-Product "Brochures Tripticos 500ud" "Papeleria" 80 80 400 1200 "Papel Couche 200gr" 10) { $i++ }
if (New-Product "Catalogos 20pags 100ud" "Papeleria" 50 50 1200 3200 "Papel Couche 200gr" 5) { $i++ }
if (New-Product "Stickers Troquel 5cm 500ud" "Rotulacion" 300 300 80 250 "Vinil Troquelado" 30) { $i++ }
if (New-Product "Stickers Troquel 10cm 200ud" "Rotulacion" 200 200 120 350 "Vinil Troquelado" 20) { $i++ }
if (New-Product "Rotulo Luminoso LED 40x60" "Rotulacion" 20 20 600 1800 "Acrilico+LED" 5) { $i++ }
if (New-Product "Rotulo Troquelado 30x50" "Rotulacion" 30 30 250 750 "Aluminio" 5) { $i++ }
if (New-Product "Letras Corporeas 10cm" "Rotulacion" 100 100 40 120 "Acrilico" 15) { $i++ }
if (New-Product "Taza Sublimada 11oz" "Sublimacion" 200 200 25 70 "Ceramica" 30) { $i++ }
if (New-Product "Camiseta Poliester Sublimada" "Sublimacion" 150 150 40 120 "Tela Poliester" 20) { $i++ }
if (New-Product "Gorra Sublimada" "Sublimacion" 80 80 35 100 "Tela Poliester" 10) { $i++ }
if (New-Product "Rompecabezas Sublimado" "Sublimacion" 60 60 50 150 "Carton 2mm" 8) { $i++ }
if (New-Product "Corte Laser Acrilico 3mm" "Corte Laser" 50 50 30 90 "Acrilico" 10) { $i++ }
if (New-Product "Corte Laser MDF 3mm" "Corte Laser" 40 40 20 65 "MDF" 8) { $i++ }
if (New-Product "Grabado Laser Metal 10x10" "Grabado" 100 100 8 35 "Metal" 15) { $i++ }
if (New-Product "Grabado Laser Vidrio 15x15" "Grabado" 60 60 15 50 "Vidrio" 10) { $i++ }
if (New-Product "Placa Metal Grabada 20x30" "Grabado" 40 40 60 200 "Aluminio" 5) { $i++ }
if (New-Product "Iman Publicitario 5x5 200ud" "Promocionales" 300 300 60 180 "Iman Flexible" 30) { $i++ }
if (New-Product "Boligrafos Personalizados 100ud" "Promocionales" 200 200 80 250 "Plastico" 20) { $i++ }
if (New-Product "Llavero Acrilico Grabado" "Promocionales" 150 150 10 35 "Acrilico" 20) { $i++ }
if (New-Product "Pendon Roll-Up 85x200cm" "Impresion" 25 25 350 950 "Lona+Mecanismo" 5) { $i++ }
if (New-Product "Valla Publicitaria 2x1m" "Impresion" 15 15 500 1500 "Lona pesada" 3) { $i++ }
if (New-Product "Carpeta Corporativa 50ud" "Papeleria" 80 80 300 900 "Cartulina couche" 10) { $i++ }
Write-Output "Productos creados: $i / 30"
