const db = require('../database/database');

const login = (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    // Try to login as customer (username might be customer_id, name, or phone)
    db.get(
        "SELECT * FROM customers WHERE (customer_id = ? OR phone = ? OR name = ?) AND password = ?", 
        [username, username, username, password], 
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(401).json({ error: "Invalid credentials" });
            
            res.json({ message: "Login successful", customer: row });
        }
    );
};

const getDashboard = (req, res) => {
    const customerId = req.params.customerId;

    db.get("SELECT * FROM customers WHERE customer_id = ?", [customerId], (err, customer) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!customer) return res.status(404).json({ error: "Customer not found" });

        db.all("SELECT * FROM collections WHERE customer_id = ? ORDER BY collection_date DESC, created_at DESC", [customerId], (err, collections) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Calculate totals
            const totalCollected = collections.reduce((sum, col) => sum + col.amount, 0);
            
            res.json({
                customer,
                totalCollected,
                collections
            });
        });
    });
};

module.exports = { login, getDashboard };
