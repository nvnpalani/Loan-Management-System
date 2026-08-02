const express = require("express");
const router = express.Router();

const collectionController = require("../controllers/collectionController");

// Order is important. Specific routes like /filter and /summary should come before parameterized routes if any exist in the future.

router.get("/collections/filter", collectionController.getFilteredCollections);
router.get("/collections/summary", collectionController.getSummary);
router.get("/collections/history/:customerId", collectionController.getCustomerHistory);
router.get("/collections", collectionController.getAllCollections);
router.post("/collections", collectionController.addCollection);
router.post("/collections/unpaid", collectionController.markUnpaid);
router.put("/collections/revert/:customerId", collectionController.revertTodayCollection);
router.put("/collections/edit/:customerId", collectionController.editTodayCollection);

module.exports = router;
