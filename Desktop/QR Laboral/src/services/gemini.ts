import { GoogleGenerativeAI } from '@google/generative-ai';
import type { WorkLog } from '../types';

// NOTE: In a real app, this key should be in an env var and PROXIED through a backend to avoid exposure.
// For this client-side demo/prototype, we will use a placeholder or ask the user to input it.
// We'll trust the user has a key or will add it.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

const genAI = new GoogleGenerativeAI(API_KEY);

export const GeminiService = {
    generateReport: async (logs: WorkLog[]): Promise<string> => {
        try {
            if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY') {
                return "⚠️ Configura tu API Key de Gemini en src/services/gemini.ts para generar reportes reales.";
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const summaryData = logs.map(l => ({
                date: l.date,
                hours: l.totalHours,
                status: l.status
            }));

            const prompt = `
        Actúa como un analista de RRHH experto. Analiza los siguientes datos de fichajes de empleados (en formato JSON simplificado) y genera un "Informe Ejecutivo de Productividad".
        
        Datos: ${JSON.stringify(summaryData, null, 2)}
        
        El informe debe ser conciso (máximo 3 párrafos), en español, y destacar:
        1. Tendencias de horas trabajadas.
        2. Anomalías detectadas (si las hay).
        3. Recomendaciones breves para mejorar la eficiencia.
        
        Usa formato Markdown para negritas y listas.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();

        } catch (error) {
            console.error("Gemini Error:", error);
            return "Error al conectar con Gemini AI. Verifica tu conexión o API Key.";
        }
    }
};
