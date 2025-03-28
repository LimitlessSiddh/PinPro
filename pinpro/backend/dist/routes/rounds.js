"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roundsController_1 = require("../controllers/roundsController");
const router = (0, express_1.Router)();
router.post('/save', (req, res) => {
    void (0, roundsController_1.saveRound)(req, res);
});
router.get('/:userId', (req, res) => {
    void (0, roundsController_1.getRounds)(req, res);
});
exports.default = router;
