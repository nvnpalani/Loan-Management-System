const express = require('express');
const router = express.Router();
const db = require('../database/database');

// Get all distinct areas
router.get('/areas', (req, res) => {
    db.all("SELECT DISTINCT area FROM customers WHERE area IS NOT NULL AND area != '' ORDER BY area ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => row.area));
    });
});

// Get daily collection summary for an area
router.get('/collection-summary', (req, res) => {
    const area = req.query.area;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!area) return res.status(400).json({ error: 'Area is required' });

    const summary = {
        totalExpected: 0,
        completedAmount: 0,
        pendingAmount: 0
    };

    // Calculate total expected TODAY (Sum of (loan_amount / duration) for customers in this area)
    db.get("SELECT SUM(loan_amount / CAST(COALESCE(NULLIF(duration, ''), '100') AS INTEGER)) as totalExpected FROM customers WHERE area = ?", [area], (err, custRow) => {
        if (err) return res.status(500).json({ error: err.message });
        
        summary.totalExpected = custRow ? Math.round(custRow.totalExpected || 0) : 0;

        // Calculate collected amount for TODAY in this area
        const query = `
            SELECT SUM(c.amount) as collectedAmount 
            FROM collections c 
            JOIN customers cu ON c.customer_id = cu.customer_id 
            WHERE cu.area = ? AND c.collection_date LIKE ? AND c.status = 'Paid'
        `;
        db.get(query, [area, `${today}%`], (err, collRow) => {
            if (err) return res.status(500).json({ error: err.message });

            summary.completedAmount = collRow ? (collRow.collectedAmount || 0) : 0;
            summary.pendingAmount = summary.totalExpected - summary.completedAmount;

            res.json(summary);
        });
    });
});

// Get customers in a specific area with their collection status for TODAY
router.get('/customers', (req, res) => {
    const area = req.query.area;
    const today = new Date().toISOString().split('T')[0];
    
    if (!area) return res.status(400).json({ error: 'Area is required' });

    const query = `
        SELECT cu.id, cu.customer_id, cu.name, cu.phone, cu.pending_amount as total_balance,
               cu.loan_amount, cu.duration,
               (SELECT SUM(amount) FROM collections WHERE customer_id = cu.customer_id AND collection_date LIKE ? AND status = 'Paid') as paid_today
        FROM customers cu
        WHERE cu.area = ?
    `;

    db.all(query, [`${today}%`, area], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Map to include a simple status
        const customers = rows.map(row => {
            return {
                ...row,
                status: row.paid_today > 0 ? 'Collected' : 'Pending'
            };
        });
        
        res.json(customers);
    });
});

module.exports = router;
