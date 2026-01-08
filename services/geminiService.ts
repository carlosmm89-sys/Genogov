
import { GoogleGenAI } from "@google/genai";
import { WorkLog, User } from "../types";

export const generateHRReport = async (logs: WorkLog[], users: User[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const contextData = logs.map(log => {
    const user = users.find(u => u.id === log.user_id);
    return {
      employee: user?.full_name,
      department: user?.department,
      date: log.date,
      hours: log.total_hours,
      status: log.status,
      startTime: log.start_time,
      endTime: log.end_time
    };
  });

  const prompt = `
    Como consultor experto en Derecho Laboral Español (Estatuto de los Trabajadores y RD-ley 8/2019), analiza estos registros:
    ${JSON.stringify(contextData)}
    
    Por favor, genera un informe ejecutivo que incluya:
    1. Resumen de cumplimiento: ¿Se están registrando correctamente las jornadas?
    2. Alertas legales: Identifica si algún empleado supera las 9 horas diarias o si no hay constancia de descansos mínimos (12h entre jornadas).
    3. Análisis de horas extra: Estimación de horas que exceden la jornada ordinaria.
    4. Recomendaciones: Consejos para evitar sanciones de la ITSS (Inspección de Trabajo).
    
    Usa un tono profesional, directo y estructurado en Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con la inteligencia artificial. Por favor, revisa los logs de consola.";
  }
};
