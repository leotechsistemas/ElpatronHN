$base = "http://localhost:8080"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$h = @{"Content-Type"="application/json"}
$r = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -Headers $h -Body '{"email":"Xd3u5@elpatron.hn","password":"admin"}' -UseBasicParsing
$h2 = @{"Authorization"="Bearer $($r.token)"; "Content-Type"="application/json; charset=utf-8"}
Write-Output "Login OK"

$deptos = @(
  @{n="Cortes";c=@("San Pedro Sula","Choloma","Puerto Cortes","Villanueva","La Lima")}
  @{n="Francisco Morazan";c=@("Tegucigalpa","Comayaguela","Talanga","Valle de Angeles","Santa Lucia")}
  @{n="Atlantida";c=@("La Ceiba","Tela","Esparta","Jutiapa","El Porvenir")}
  @{n="Yoro";c=@("Yoro","El Progreso","Olanchito","Santa Rita","Jocon")}
  @{n="Olancho";c=@("Juticalpa","Catacamas","San Francisco","Patuca","Campamento")}
  @{n="Colon";c=@("Trujillo","Tocoa","Bonito Oriental","Limon","Santa Rosa de Aguan")}
  @{n="Gracias a Dios";c=@("Puerto Lempira","Ahuas","Brus Laguna","Wampusirpe","Juan Francisco Bulnes")}
  @{n="El Paraiso";c=@("Danli","El Paraiso","Yuscaran","Jinotepe","Trojes")}
  @{n="Choluteca";c=@("Choluteca","Pespire","El Triunfo","San Marcos de Colon","Ciudad Choluteca")}
  @{n="Valle";c=@("Nacaome","San Francisco de Coray","Amapala","Langue","Goascoran")}
  @{n="La Paz";c=@("La Paz","Marcala","San Jose","Lepaguare","Cabanas")}
  @{n="Intibuca";c=@("La Esperanza","Intibuca","Jesus de Otoro","San Miguelito","San Isidro")}
  @{n="Lempira";c=@("Gracias","Cololaca","Tambla","La Union","Tomatala")}
  @{n="Ocotepeque";c=@("Ocotepeque","San Marcos","Sinuapa","Concepcion","La Encarnacion")}
  @{n="Copan";c=@("Santa Rosa de Copan","Copan Ruinas","Corquin","Dulce Nombre","Florida")}
  @{n="Santa Barbara";c=@("Santa Barbara","Quimistan","Trinidad","Macuelizo","San Luis")}
  @{n="Comayagua";c=@("Comayagua","Siguatepeque","La Libertad","Taulabe","Ajuterique")}
  @{n="Islas de la Bahia";c=@("Roatan","Utila","Guanaja","Santos Guardiola","French Harbour")}
)

$nombres = @(
  "Carlos Mendoza","Maria Lopez","Jose Garcia","Ana Martinez","Luis Hernandez",
  "Sofia Rodriguez","Pedro Sanchez","Elena Ramirez","Jorge Torres","Diana Flores",
  "Roberto Castro","Veronica Morales","Fernando Ortiz","Gabriela Ruiz","Manuel Aguilar",
  "Patricia Vargas","Ricardo Herrera","Adriana Soto","Andres Peña","Monica Rivas",
  "Hector Guzman","Lorena Mendez","Sergio Navarro","Carolina Delgado","Oscar Vega",
  "Natalia Campos","Diego Paredes","Ximena Rojas","Alberto Sandoval","Marcela Nuñez",
  "Eduardo Rivera","Daniela Luna","Miguel Mora","Paola Carmona","Francisco Jimenez",
  "Claudia Medina","Alejandro Salazar","Silvia Escobar","Rafael Caceres","Tania Zavala",
  "Julio Garay","Rosa Peralta","Vicente Ibarra","Martha Cueva","Cristian Machado",
  "Lidia Padilla","Enrique Solis","Maritza Villeda","Mario Arriaga","Esther Bonilla",
  "Humberto Guevara","Sandra Ponce","Rolando Alvarado","Margarita Cabrera","Armando Maldonado",
  "Karla Ordoñez","Wilfredo Bustamante","Ruth Godoy","Erick Landaverde","Olga Cerrato"
)

$apellidosRTN = @("Garcia","Martinez","Lopez","Hernandez","Gonzalez","Perez","Rodriguez","Sanchez","Ramirez","Cruz","Flores","Morales","Ortiz","Ruiz","Aguilar","Vargas","Herrera","Soto","Peña","Rivas")

$total = 0
$errors = 0

foreach ($d in $deptos) {
  $deptName = $d.n
  $ciudades = $d.c
  
  # 5 con RTN
  for ($i = 0; $i -lt 5; $i++) {
    $ape = $apellidosRTN | Get-Random
    $ano = Get-Random -Min 1990 -Max 2005
    $num = Get-Random -Min 10000 -Max 99999
    $rtnVal = "0801-$ano$num"
    $name = $nombres | Get-Random
    $city = $ciudades | Get-Random
    $tel = "+504 9" + (Get-Random -Min 10000000 -Max 99999999).ToString()
    $email = "c$($total)@elpatron.hn"
    $clasif = if ($i -lt 2) { "VIP" } else { "Estandar" }
    
    $j = "{`"nombre`":`"$name`",`"rtn`":`"$rtnVal`",`"telefono`":`"$tel`",`"email`":`"$email`",`"estado`":`"Activo`",`"clasificacion`":`"$clasif`",`"departamento`":`"$deptName`",`"ciudad`":`"$city`"}"
    $b = $utf8.GetBytes($j)
    try {
      Invoke-RestMethod -Uri "$base/api/clients" -Method POST -Headers $h2 -Body $b -UseBasicParsing | Out-Null
      $total++
    } catch { $errors++ }
  }
  
  # 5 sin RTN
  for ($i = 0; $i -lt 5; $i++) {
    $name = $nombres | Get-Random
    $city = $ciudades | Get-Random
    $tel = "+504 3" + (Get-Random -Min 10000000 -Max 99999999).ToString()
    $email = "c$($total)@elpatron.hn"
    
    $j = "{`"nombre`":`"$name`",`"rtn`":`"`",`"telefono`":`"$tel`",`"email`":`"$email`",`"estado`":`"Activo`",`"clasificacion`":`"Estandar`",`"departamento`":`"$deptName`",`"ciudad`":`"$city`"}"
    $b = $utf8.GetBytes($j)
    try {
      Invoke-RestMethod -Uri "$base/api/clients" -Method POST -Headers $h2 -Body $b -UseBasicParsing | Out-Null
      $total++
    } catch { $errors++ }
  }
}

Write-Output "Clientes creados: $total | Errores: $errors"
