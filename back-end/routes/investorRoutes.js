const express = require("express");
const router = express.Router();
const investorController = require("../controllers/investorController");

router.get("/investors", investorController.getAllInvestors);
router.post("/investors", investorController.addInvestor);
router.put("/investors/:id", investorController.updateInvestor);
router.delete("/investors/:id", investorController.deleteInvestor);

module.exports = router;
