"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const jwt_1 = require("./lib/jwt");
(0, jwt_1.assertJwtConfigured)();
const PORT = process.env.PORT || 5050;
app_1.app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
