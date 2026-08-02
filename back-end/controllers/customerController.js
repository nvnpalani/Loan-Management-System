const customerModel = require("../models/customerModel");

const getAllCustomers = (req, res) => {

    customerModel.getAllCustomers((err, customers) => {

        if (err) {
            return res.status(500).json({
                message: "Error fetching customers",
                error: err.message
            });
        }

        res.status(200).json(customers); 

    });

};
const addCustomer = (req, res) => {

    customerModel.addCustomer(req.body, (err, id) => {

        if (err) {
            return res.status(500).json({
                message: "Error adding customer",
                error: err.message
            });
        }

        res.status(201).json({
            message: "Customer added successfully",
            customerId: id
        });

    });

};

const updateCustomer = (req, res) => {
    const id = req.params.id;
    customerModel.updateCustomer(id, req.body, (err, changes) => {
        if (err) {
            return res.status(500).json({
                message: "Error updating customer",
                error: err.message
            });
        }
        if (changes === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }
        res.status(200).json({ message: "Customer updated successfully" });
    });
};

const deleteCustomer = (req, res) => {
    const id = req.params.id;
    customerModel.deleteCustomer(id, (err, changes) => {
        if (err) {
            return res.status(500).json({
                message: "Error deleting customer",
                error: err.message
            });
        }
        if (changes === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }
        res.status(200).json({ message: "Customer deleted successfully" });
    });
};

module.exports = {
    addCustomer,
    getAllCustomers,
    updateCustomer,
    deleteCustomer
};