"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
var generative_ai_1 = require("@google/generative-ai");
// NOTE: In a real app, this key should be in an env var and PROXIED through a backend to avoid exposure.
// For this client-side demo/prototype, we will use a placeholder or ask the user to input it.
// We'll trust the user has a key or will add it.
var API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
var genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
exports.GeminiService = {
    generateReport: function (logs) { return __awaiter(void 0, void 0, void 0, function () {
        var model, summaryData, prompt_1, result, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY') {
                        return [2 /*return*/, "⚠️ Configura tu API Key de Gemini en src/services/gemini.ts para generar reportes reales."];
                    }
                    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    summaryData = logs.map(function (l) { return ({
                        date: l.date,
                        hours: l.totalHours,
                        status: l.status
                    }); });
                    prompt_1 = "\n        Act\u00FAa como un analista de RRHH experto. Analiza los siguientes datos de fichajes de empleados (en formato JSON simplificado) y genera un \"Informe Ejecutivo de Productividad\".\n        \n        Datos: ".concat(JSON.stringify(summaryData, null, 2), "\n        \n        El informe debe ser conciso (m\u00E1ximo 3 p\u00E1rrafos), en espa\u00F1ol, y destacar:\n        1. Tendencias de horas trabajadas.\n        2. Anomal\u00EDas detectadas (si las hay).\n        3. Recomendaciones breves para mejorar la eficiencia.\n        \n        Usa formato Markdown para negritas y listas.\n      ");
                    return [4 /*yield*/, model.generateContent(prompt_1)];
                case 1:
                    result = _a.sent();
                    return [4 /*yield*/, result.response];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, response.text()];
                case 3:
                    error_1 = _a.sent();
                    console.error("Gemini Error:", error_1);
                    return [2 /*return*/, "Error al conectar con Gemini AI. Verifica tu conexión o API Key."];
                case 4: return [2 /*return*/];
            }
        });
    }); }
};
