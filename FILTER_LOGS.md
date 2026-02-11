# 📱 Filtrar Logs de ADB - Solo Tu App

## Comando para ver SOLO logs de tu app:

```powershell
adb logcat | Select-String -Pattern "com.tuponesyocomo.app|tuponesyocomo|ExponentImagePicker|ReactNativeJS|FATAL"
```

## Comando más específico (solo errores y tu app):

```powershell
adb logcat *:E | Select-String -Pattern "tuponesyocomo"
```

## Comando para guardar logs filtrados:

```powershell
adb logcat -d | Select-String -Pattern "com.tuponesyocomo.app|tuponesyocomo|ExponentImagePicker|ReactNativeJS|FATAL|error|exception" | Out-File app_logs.txt
notepad app_logs.txt
```

## El error que estás viendo:

```
Error: Cannot find native module 'ExponentImagePicker'
```

Este es el mismo error que ya arreglamos en el código. Necesitas rebuild el APK con las dependencias actualizadas.



