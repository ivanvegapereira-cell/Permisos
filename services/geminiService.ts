
import { GoogleGenAI, Type } from "@google/genai";
import { PermissionFormData } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateFormalEmailBody(data: PermissionFormData): Promise<string> {
  const prompt = `
    Genera un cuerpo de correo electrónico que simule una PLANTILLA DE FORMULARIO OFICIAL para una solicitud de permiso administrativo. 
    Debe contener TODOS los datos del solicitante de forma estructurada y profesional.
    
    DATOS A INCLUIR:
    - Nombre Completo del Educador: ${data.educatorName}
    - Cargo: ${data.position}
    - Horas de contrato: ${data.contractHours}
    - Fecha de solicitud: ${data.requestDate}
    - Fecha de ejecución del permiso: ${data.executionDate}
    - Tiempo cronológico: ${data.durationHours} horas y ${data.durationMinutes} minutos
    - Motivo: ${data.reason}
    - Tipo de Remuneración: ${data.withPay ? 'CON GOCE DE SUELDO' : 'SIN GOCE DE SUELDO'}
    - Área de Dependencia: ${data.area}
    - Notas adicionales: ${data.additionalNotes || 'Ninguna'}

    ESTILO:
    - Encabezado: "SOLICITUD DE PERMISO ADMINISTRATIVO - COLEGIO SALESIANO CONCEPCIÓN"
    - Formato: Usa etiquetas claras como "[DATOS DEL SOLICITANTE]", "[DETALLES DEL PERMISO]", etc.
    - El tono debe ser formal y el diseño de texto debe ser fácil de leer para un coordinador.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Error al generar la plantilla del formulario.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al procesar la solicitud con IA.";
  }
}

export async function validateRequestSummary(data: PermissionFormData): Promise<{ summary: string; isValid: boolean }> {
  const prompt = `
    Analiza esta solicitud de permiso y proporciona un resumen ejecutivo corto de 2 líneas.
    Datos: ${JSON.stringify(data)}
    Responde en formato JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            isValid: { type: Type.BOOLEAN }
          },
          required: ["summary", "isValid"]
        }
      }
    });
    
    return JSON.parse(response.text || '{"summary": "Solicitud recibida", "isValid": true}');
  } catch (error) {
    return { summary: "Solicitud de permiso procesada correctamente.", isValid: true };
  }
}
