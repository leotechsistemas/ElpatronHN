$java = "C:\Program Files\Eclipse Adoptium\jdk-25.0.1.8-hotspot\bin\java.exe"
$jar = "C:\Users\pc\Desktop\soluciones\backend-java\target\erp-0.0.1-SNAPSHOT.jar"
$log = "C:\Users\pc\Desktop\soluciones\backend-java\data\backend-start.log"
$proc = Start-Process -FilePath $java -ArgumentList "--enable-native-access=ALL-UNNAMED", "-jar", $jar -NoNewWindow -RedirectStandardOutput $log -RedirectStandardError $log -PassThru
Write-Output "Backend PID: $($proc.Id)"
