const revenueModel = require("../models/revenueModel");

const getAllRevenues = (req, res) => {
    revenueModel.getAllRevenues((err, revenues) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(revenues);
    });
};

const addRevenue = (req, res) => {
    revenueModel.addRevenue(req.body, (err, id) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Revenue added", id });
    });
};

const deleteRevenue = (req, res) => {
    revenueModel.deleteRevenue(req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Revenue deleted" });
    });
};

module.exports = { getAllRevenues, addRevenue, deleteRevenue };
