# Seguridad de Variables de Entorno

## Variables `EXPO_PUBLIC_*` son Públicas por Diseño

Las variables que empiezan con `EXPO_PUBLIC_` **son públicas** y se incluyen en el bundle del cliente. Esto es **intencional y seguro** para Supabase.

## ¿Por qué es seguro?

### 1. `EXPO_PUBLIC_SUPABASE_URL`
- **Es pública**: Es la URL de tu proyecto Supabase
- **Es segura**: No contiene información sensible
- **Ejemplo**: `https://tu-proyecto.supabase.co`

### 2. `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Es pública**: La clave anónima está diseñada para ser usada en el cliente
- **Es segura**: Está protegida por **Row Level Security (RLS)** en Supabase
- **No es secreta**: Cualquiera puede verla en el código del navegador, pero **no puede hacer nada malo** porque:
  - RLS limita qué datos puede acceder
  - Solo permite operaciones permitidas por tus políticas
  - No puede acceder a datos privados sin autenticación

### 3. `EXPO_PUBLIC_API_BASE_URL`
- **Es pública**: Es solo una URL
- **Es segura**: No contiene secretos, solo la dirección del API
- **Ejemplo**: `https://api.tuponesyocomo.uk`

## ¿Qué NO debe ser público?

❌ **NUNCA** uses `EXPO_PUBLIC_*` para:
- Claves de servicio de Supabase (service role key)
- Tokens de autenticación
- Secretos del backend
- API keys privadas

✅ **SÍ** usa `EXPO_PUBLIC_*` para:
- URLs públicas
- Claves anónimas públicas (como Supabase anon key)
- Configuración del cliente

## Protección en Supabase

Supabase protege tus datos mediante:
1. **Row Level Security (RLS)**: Políticas que limitan el acceso a los datos
2. **Clave anónima**: Solo permite operaciones permitidas por RLS
3. **Clave de servicio**: Esta SÍ es secreta y solo debe usarse en el backend

## Conclusión

Las variables `EXPO_PUBLIC_*` que estás usando son **seguras y correctas**. Están diseñadas para ser públicas en aplicaciones cliente. La seguridad real viene de las políticas RLS en Supabase, no de ocultar estas claves.



