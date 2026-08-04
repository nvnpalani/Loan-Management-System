const db = require('../database/database');

const login = (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    // 1. Check Admin
    if (username === 'admin' && password === 'admin123') {
        return res.json({ role: 'admin', data: { name: 'Admin', id: 'admin' } });
    }

    // 1.5 Check Collection Agent
    if (username === 'agent' && password === 'agent123') {
        return res.json({ role: 'employee', data: { name: 'Field Agent', id: 'agent_01', employee_id: 'agent_01' } });
    }

    // 2. Check Customers (Customer Portal)
    db.get(
        "SELECT * FROM customers WHERE (customer_id = ? OR phone = ? OR name = ?) AND password = ?", 
        [username, username, username, password], 
        (err, custRow) => {
            if (err) return res.status(500).json({ error: err.message });
            if (custRow) {
                return res.json({ role: 'customer', data: custRow });
            }

            // If not found in any
            return res.status(401).json({ error: "Invalid username or password" });
        }
    );
};

module.exports = { login };
