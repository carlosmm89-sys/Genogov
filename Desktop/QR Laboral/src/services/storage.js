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
exports.StorageService = void 0;
var supabase_1 = require("./supabase");
// Helper to map DB response to Type
var mapUser = function (data) { return ({
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    department: data.department,
    pin: data.pin,
    avatar: data.avatar || "https://ui-avatars.com/api/?name=".concat(encodeURIComponent(data.name), "&background=random"),
}); };
var mapLog = function (data) { return ({
    id: data.id,
    userId: data.user_id,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    breaks: data.breaks || [],
    status: data.status,
    totalHours: data.total_hours || 0,
}); };
exports.StorageService = {
    init: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    }); },
    getUsers: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase_1.supabase.from('users').select('*')];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching users:', error);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, data.map(mapUser)];
            }
        });
    }); },
    getLogs: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase_1.supabase.from('work_logs').select('*')];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching logs:', error);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, data.map(mapLog)];
            }
        });
    }); },
    getUserByEmail: function (email) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase_1.supabase.from('users').select('*').eq('email', email).single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error || !data)
                        return [2 /*return*/, undefined];
                    return [2 /*return*/, mapUser(data)];
            }
        });
    }); },
    getUserByPin: function (pin) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase_1.supabase.from('users').select('*').eq('pin', pin).single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error || !data)
                        return [2 /*return*/, undefined];
                    return [2 /*return*/, mapUser(data)];
            }
        });
    }); },
    saveLog: function (log) { return __awaiter(void 0, void 0, void 0, function () {
        var dbLog, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dbLog = {
                        id: log.id, // Supabase usually auto-generates IDs if UUID, but we can try to upsert if we manage IDs
                        user_id: log.userId,
                        date: log.date,
                        start_time: log.startTime,
                        end_time: log.endTime,
                        breaks: log.breaks,
                        status: log.status,
                        total_hours: log.totalHours,
                    };
                    return [4 /*yield*/, supabase_1.supabase.from('work_logs').upsert(dbLog)];
                case 1:
                    error = (_a.sent()).error;
                    if (error)
                        console.error('Error saving log:', error);
                    return [2 /*return*/];
            }
        });
    }); },
    deleteUser: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, supabase_1.supabase.from('users').delete().eq('id', userId)];
                case 1:
                    error = (_a.sent()).error;
                    if (error)
                        console.error('Error deleting user:', error);
                    return [2 /*return*/];
            }
        });
    }); },
    createUser: function (user) { return __awaiter(void 0, void 0, void 0, function () {
        var dbUser, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dbUser = {
                        id: user.id || crypto.randomUUID(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        department: user.department,
                        pin: user.pin,
                        avatar: user.avatar
                    };
                    return [4 /*yield*/, supabase_1.supabase.from('users').insert(dbUser)];
                case 1:
                    error = (_a.sent()).error;
                    if (error)
                        console.error('Error creating user:', error);
                    return [2 /*return*/];
            }
        });
    }); },
    // Simple auth persistence (LocalStorage is fine for "session" simulation in this demo, 
    // or we could use Supabase Auth properly, but let's stick to the pin logic for now with local persistence of "who is logged in")
    getCurrentUser: function () {
        var data = localStorage.getItem('qrlaboral_current_user');
        return data ? JSON.parse(data) : null;
    },
    setCurrentUser: function (user) {
        if (user) {
            localStorage.setItem('qrlaboral_current_user', JSON.stringify(user));
        }
        else {
            localStorage.removeItem('qrlaboral_current_user');
        }
    }
};
