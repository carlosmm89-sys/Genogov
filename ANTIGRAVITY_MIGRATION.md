# GenoGov SAAS - Blueprint de Migración (Antigravity / Vercel / Supabase)

Este documento contiene las especificaciones técnicas necesarias para migrar el prototipo actual de GenoGov SAAS a un entorno de producción real utilizando **Vercel** para el despliegue y **Supabase** como base de datos relacional.

## 1. Arquitectura de Datos (Supabase / PostgreSQL)

Para pasar del entorno local (SQLite) a Supabase, ejecuta el siguiente script SQL en el editor de Supabase para crear las tablas necesarias con soporte para JSONB y auditoría.

```sql
-- Tabla de Expedientes (Trees)
CREATE TABLE trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    data JSONB NOT NULL, -- Contiene nodes, edges, individuals, families
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Auditoría (Audit Logs)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    case_id TEXT NOT NULL, -- Referencia al case_number
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS) para cumplimiento de LOPD
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Índice para búsquedas rápidas por expediente
CREATE INDEX idx_trees_case_number ON trees(case_number);
CREATE INDEX idx_audit_logs_case_id ON audit_logs(case_id);
```

## 2. Variables de Entorno Requeridas

Configura estas variables en el panel de **Vercel** y en tu archivo `.env` local:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SUPABASE_URL` | URL de tu proyecto Supabase | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Clave anónima pública | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta (solo servidor) | `eyJhbGci...` |
| `GEMINI_API_KEY` | API Key para el Diagnóstico IA | `AIzaSy...` |

## 3. Adaptación del Código (Server-Side)

Para conectar con Supabase en el entorno real, sustituye el uso de `better-sqlite3` por el cliente oficial de Supabase:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Ejemplo de guardado:
// const { data, error } = await supabase
//   .from('trees')
//   .upsert({ case_number: id, name, data: JSON.stringify(data) })
```

## 4. Flujo de Despliegue en Vercel

1. **Conectar Repositorio**: Conecta tu GitHub/GitLab a Vercel.
2. **Build Settings**: 
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Serverless Functions**: Vercel detectará automáticamente `server.ts` si se configura como una API Route o si se usa un adaptador de Express para Vercel.

## 5. Parámetros de Memoria para Antigravity

- **Contexto**: Aplicación de Trabajo Social para Ayuntamientos.
- **Seguridad**: Requiere auditoría estricta de cada cambio.
- **Privacidad**: Implementado "Privacy Mode" para anonimización visual.
- **IA**: Uso de Gemini 3 Flash para diagnósticos sociales basados en genogramas.
- **Exportación**: Compatible con GEDCOM 5.5.
