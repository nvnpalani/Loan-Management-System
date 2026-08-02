const investorModel = require("../models/investorModel");

const getAllInvestors = (req, res) => {
    investorModel.getAllInvestors((err, investors) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(investors);
    });
};

const addInvestor = (req, res) => {
    investorModel.addInvestor(req.body, (err, id) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Investor added successfully", id });
    });
};

const updateInvestor = (req, res) => {
    investorModel.updateInvestor(req.params.id, req.body, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Investor updated" });
    });
};

const deleteInvestor = (req, res) => {
    investorModel.deleteInvestor(req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Investor deleted" });
    });
};

module.exports = { getAllInvestors, addInvestor, updateInvestor, deleteInvestor };
