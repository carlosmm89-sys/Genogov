
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WorkLog, User } from "../types";

// Initialize Gemini API
// Note: In a real production app, you should use a backend proxy to protect your API key
// For this demo, we'll use a placeholder or environment variable if available
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export const generateHRReport = async (logs: WorkLog[], employees: User[]) => {
    if (!API_KEY) {
        console.warn("Gemini API Key is missing. Returning mock analysis.");
        return mockAnalysis(logs, employees);
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Prepare data summary for the prompt
        const totalHours = logs.reduce((acc, log) => acc + (log.total_hours || 0), 0);
        const activeEmployees = new Set(logs.map(l => l.user_id)).size;

        const prompt = `
      Actúa como un experto consultor de RRHH. Analiza los siguientes datos de fichajes de esta semana:
      - Total de horas trabajadas: ${totalHours.toFixed(2)}
      - Empleados activos: ${activeEmployees} de ${employees.length}
      - Total de registros: ${logs.length}

      Genera un informe ejecutivo breve (máximo 150 palabras) en español con:
      1. Resumen de productividad.
      2. Una recomendación clave para mejorar la eficiencia.
      3. Un tono profesional y motivador.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Error generating AI report:", error);
        return mockAnalysis(logs, employees);
    }
};

const mockAnalysis = (logs: WorkLog[], employees: User[]) => {
    const totalHours = logs.reduce((acc, log) => acc + (log.total_hours || 0), 0);
    return `
    **Informe de Productividad (Simulado)**

    Esta semana el equipo ha registrado un total de **${totalHours.toFixed(1)} horas**. 
    Se observa una actividad constante en los departamentos principales.
    
    *Recomendación:* Asegurar que todos los empleados completen sus registros de salida para mantener la precisión de los datos.
    ¡Buen trabajo equipo!
  `;
}
