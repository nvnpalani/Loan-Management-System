const express = require("express");
const router = express.Router();
const revenueController = require("../controllers/revenueController");

router.get("/revenues", revenueController.getAllRevenues);
router.post("/revenues", revenueController.addRevenue);
router.delete("/revenues/:id", revenueController.deleteRevenue);

module.exports = router;
