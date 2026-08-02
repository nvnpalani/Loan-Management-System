const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");

router.post("/customers", customerController.addCustomer);

router.get("/customers", customerController.getAllCustomers);

router.put("/customers/:id", customerController.updateCustomer);

router.delete("/customers/:id", customerController.deleteCustomer);

module.exports = router;