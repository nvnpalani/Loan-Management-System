const collectionModel = require("../models/collectionModel");

// 1. Get all collections
const getAllCollections = (req, res) => {
    collectionModel.getAllCollections((err, collections) => {
        if (err) {
            return res.status(500).json({
                message: "Error fetching collections",
                error: err.message
            });
        }
        res.status(200).json(collections);
    });
};

// 2. Get Filtered Collections
const getFilteredCollections = (req, res) => {
    const filters = {
        area: req.query.area,
        employee: req.query.employee,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    collectionModel.getFilteredCollections(filters, (err, collections) => {
        if (err) {
            return res.status(500).json({
                message: "Error fetching filtered collections",
                error: err.message
            });
        }
        res.status(200).json(collections);
    });
};

// 3. Get Summary Data
const getSummary = (req, res) => {
    const area = req.query.area;

    collectionModel.getSummary(area, (err, summary) => {
        if (err) {
            return res.status(500).json({
                message: "Error fetching summary",
                error: err.message
            });
        }
        res.status(200).json(summary);
    });
};

// 3.5 Get Customer History
const getCustomerHistory = (req, res) => {
    const { customerId } = req.params;

    collectionModel.getCustomerHistory(customerId, (err, history) => {
        if (err) {
            return res.status(500).json({
                message: "Error fetching customer history",
                error: err.message
            });
        }
        res.status(200).json(history);
    });
};

// 4. Add a Collection
const addCollection = (req, res) => {
    collectionModel.addCollection(req.body, (err, id) => {
        if (err) {
            return res.status(500).json({
                message: "Error adding collection",
                error: err.message
            });
        }
        res.status(201).json({
            message: "Collection added successfully",
            collectionId: id
        });
    });
};

// 5. Mark Unpaid
const markUnpaid = (req, res) => {
    collectionModel.markUnpaid(req.body, (err, changes) => {
        if (err) {
            return res.status(500).json({
                message: "Error marking unpaid",
                error: err.message
            });
        }
        res.status(200).json({
            message: "Marked Unpaid successfully",
            changes
        });
    });
};

// 6. Revert Today's Collection
const revertTodayCollection = (req, res) => {
    const { customerId } = req.params;
    const { reason } = req.body;
    
    collectionModel.revertTodayCollection(customerId, reason, (err, changes) => {
        if (err) {
            return res.status(500).json({
                message: "Error reverting collection",
                error: err.message
            });
        }
        res.status(200).json({
            message: "Collection reverted successfully",
            changes
        });
    });
};

// 7. Edit Today's Collection
const editTodayCollection = (req, res) => {
    const { customerId } = req.params;
    
    collectionModel.editTodayCollection(customerId, req.body, (err, changes) => {
        if (err) {
            return res.status(500).json({
                message: "Error editing collection",
                error: err.message
            });
        }
        res.status(200).json({
            message: "Collection edited successfully",
            changes
        });
    });
};

module.exports = {
    getAllCollections,
    getFilteredCollections,
    getSummary,
    addCollection,
    markUnpaid,
    revertTodayCollection,
    editTodayCollection,
    getCustomerHistory
};
