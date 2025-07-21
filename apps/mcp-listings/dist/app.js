"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = build;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const tools_1 = require("./routes/tools");
function build(opts = {}) {
    const app = (0, fastify_1.default)(opts);
    // Register plugins
    app.register(cors_1.default, { origin: true });
    // Register routes
    app.register(tools_1.toolsRoutes);
    return app;
}
