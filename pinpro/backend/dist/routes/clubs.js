"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clubsController_1 = require("../controllers/clubsController");
const router = (0, express_1.Router)();
// Save club setup to PostgreSQL
router.post('/save', (req, res) => {
    (0, clubsController_1.saveClubs)(req, res);
});
// Get club setup by userId from PostgreSQL
router.get('/:userId', (req, res) => {
    (0, clubsController_1.getClubs)(req, res);
});
exports.default = router;
