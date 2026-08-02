const db = require('../database/database');

const getDashboardSummary = (req, res) => {
    const { area } = req.query;
    const today = new Date().toISOString().split('T')[0];

    // Today's Target: Sum of loan_amount / duration (approx daily EMI) for customers in that area
    // This depends on how the DB calculates EMI. Since there's no fixed EMI column, 
    // let's estimate it from loan_amount / 100 as a placeholder, or we can use pending_amount.
    // The design shows specific target amounts. I'll query customers and collections.

    let customerQuery = `SELECT * FROM customers WHERE 1=1`;
    let params = [];
    if (area && area !== 'All') {
        customerQuery += ` AND area = ?`;
        params.push(area);
    }
    // Mobile usually filters by employee too, but let's stick to area for now as per design

    db.all(customerQuery, params, (err, customers) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let target = 0;
        let pendingCustomers = 0;

        customers.forEach(c => {
            // Placeholder target calculation: assuming 1% of loan amount is daily target
            const dailyTarget = c.loan_amount * 0.01;
            target += dailyTarget;
            if (c.pending_amount > 0) {
                pendingCustomers++;
            }
        });

        // Get collected amount today
        let collQuery = `SELECT SUM(amount) as collected FROM collections WHERE collection_date = ?`;
        let collParams = [today];
        if (area && area !== 'All') {
            collQuery += ` AND customer_id IN (SELECT customer_id FROM customers WHERE area = ?)`;
            collParams.push(area);
        }

        db.get(collQuery, collParams, (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const collected = row.collected || 0;
            const pendingAmount = target - collected;

            res.json({
                target: Math.round(target),
                collected: Math.round(collected),
                pendingAmount: Math.round(pendingAmount > 0 ? pendingAmount : 0),
                customersPending: pendingCustomers
            });
        });
    });
};

const getMobileCustomers = (req, res) => {
    const { area } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let query = `
        SELECT c.*, 
               (SELECT SUM(amount) FROM collections col WHERE col.customer_id = c.customer_id AND col.collection_date = ?) as paid_today
        FROM customers c
        WHERE 1=1
    `;
    let params = [today];
    
    if (area && area !== 'All') {
        query += ` AND c.area = ?`;
        params.push(area);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const result = rows.map(r => ({
            ...r,
            status: r.paid_today > 0 ? 'Collected' : 'Pending',
            due_today: Math.round(r.loan_amount * 0.01) // Estimated daily EMI
        }));
        
        res.json(result);
    });
};

const getRecentCollections = (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    db.all(`
        SELECT col.*, c.name, c.phone 
        FROM collections col
        JOIN customers c ON col.customer_id = c.customer_id
        WHERE col.collection_date = ?
        ORDER BY col.created_at DESC
        LIMIT 10
    `, [today], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
}

const downloadSyncData = (req, res) => {
    const { area } = req.query;
    const today = new Date().toISOString().split('T')[0];

    // Fetch Areas
    db.all("SELECT DISTINCT area FROM customers WHERE area IS NOT NULL", [], (err, areaRows) => {
        if (err) return res.status(500).json({ error: err.message });
        const areas = areaRows.map(r => r.area);

        // Fetch Customers for this area/employee
        let custQuery = `SELECT * FROM customers WHERE 1=1`;
        let params = [];
        if (area && area !== 'All') {
            custQuery += ` AND area = ?`;
            params.push(area);
        }

        db.all(custQuery, params, (err, customers) => {
            if (err) return res.status(500).json({ error: err.message });

            // Fetch today's collections to determine status
            db.all(`SELECT customer_id, amount FROM collections WHERE collection_date = ?`, [today], (err, collections) => {
                if (err) return res.status(500).json({ error: err.message });

                let target = 0;
                let collected = 0;
                let pendingCustomers = 0;

                const customerList = customers.map(c => {
                    const paidToday = collections.filter(col => col.customer_id === c.customer_id).reduce((sum, col) => sum + col.amount, 0);
                    const dueToday = Math.round(c.loan_amount * 0.01); // 1% estimation
                    target += dueToday;
                    collected += paidToday;
                    if (paidToday === 0) pendingCustomers++;

                    return {
                        ...c,
                        status: paidToday > 0 ? 'Collected' : 'Pending',
                        due_today: dueToday
                    };
                });

                res.json({
                    areas,
                    customers: customerList,
                    summary: {
                        target: Math.round(target),
                        collected: Math.round(collected),
                        pendingAmount: Math.round(target - collected > 0 ? target - collected : 0),
                        customersPending: pendingCustomers
                    }
                });
            });
        });
    });
};

const uploadSyncData = (req, res) => {
    const collections = req.body; // Expecting array of collections
    if (!collections || !Array.isArray(collections) || collections.length === 0) {
        return res.json({ message: "No collections to sync", syncedCount: 0 });
    }

    let syncedCount = 0;
    let errors = [];

    const insertCollection = (col, callback) => {
        const { collection_id, customer_id, amount, payment_mode, remarks, collection_date } = col;
        
        // Use a client-generated collection_id or a unique one to prevent duplicates
        const cid = collection_id || `SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        db.run(`
            INSERT INTO collections (collection_id, customer_id, collection_date, amount, payment_mode, remarks, employee_id, status)
            VALUES (?, ?, ?, ?, ?, ?, 'admin', 'Paid')
        `, [cid, customer_id, collection_date, amount, payment_mode, remarks], function(err) {
            if (err) {
                // If unique constraint fails, it means it's already synced
                if (err.message.includes('UNIQUE constraint failed')) {
                    callback(null); 
                } else {
                    callback(err);
                }
            } else {
                // Update customer table
                db.run(`UPDATE customers SET collected_amount = collected_amount + ?, pending_amount = pending_amount - ? WHERE customer_id = ?`,
                [amount, amount, customer_id], (err2) => {
                    if (err2) callback(err2);
                    else callback(null);
                });
            }
        });
    };

    let processed = 0;
    collections.forEach(col => {
        insertCollection(col, (err) => {
            if (err) errors.push({ col, error: err.message });
            else syncedCount++;

            processed++;
            if (processed === collections.length) {
                if (errors.length > 0) {
                    res.status(500).json({ message: "Sync partially completed with errors", syncedCount, errors });
                } else {
                    res.json({ message: "Sync successful", syncedCount });
                }
            }
        });
    });
};

module.exports = { getDashboardSummary, getMobileCustomers, getRecentCollections, downloadSyncData, uploadSyncData };
