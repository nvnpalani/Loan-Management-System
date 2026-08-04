const express = require("express");
const router = express.Router();
const db = require("../database/database");

router.get("/dashboard/stats", (req, res) => {
    const stats = {};

    db.get("SELECT COUNT(*) as totalInvestors, SUM(investment_amount) as totalInvestorAmount, SUM(profit_paid) as totalInvestorPaidAmount FROM investors", (err, invRow) => {
        if (err) return res.status(500).json({ error: err.message });
        const totalInvestor = invRow.totalInvestorAmount || 0;
        stats.totalInvestors = invRow.totalInvestors || 0;
        stats.totalLiveInvestorAmount = totalInvestor * 0.9; // Live Investment is 90% (Total - 10% Backup)
        stats.totalInvestorPaidAmount = invRow.totalInvestorPaidAmount || 0;

        db.get("SELECT COUNT(*) as totalCustomers, SUM(loan_amount) as totalCustomerLoanAmount FROM customers", (err, custRow) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.totalCustomers = custRow.totalCustomers || 0;
            stats.totalCustomerLoanAmount = custRow.totalCustomerLoanAmount || 0;

            db.get("SELECT SUM(amount) as totalCollectedAmount FROM collections WHERE status = 'Paid'", (err, collRow) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.totalCollectedAmount = collRow.totalCollectedAmount || 0;
                stats.totalPendingAmount = stats.totalCustomerLoanAmount - stats.totalCollectedAmount;

                const month = req.query.month;
                let dailyQuery = "SELECT collection_date as date, SUM(amount) as amount FROM collections WHERE status = 'Paid'";
                let params = [];
                
                if (month) {
                    dailyQuery += " AND collection_date LIKE ?";
                    params.push(`${month}%`);
                    dailyQuery += " GROUP BY collection_date ORDER BY collection_date ASC";
                } else {
                    dailyQuery += " GROUP BY collection_date ORDER BY collection_date DESC LIMIT 7";
                }

                db.all(dailyQuery, params, (err, dailyData) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    let collections = dailyData || [];
                    if (!month && collections.length > 0) {
                        // If no month is selected, we got DESC LIMIT 7. Reverse it to ASC.
                        collections = collections.reverse();
                    }
                    
                    stats.dailyCollections = collections;

                    res.json(stats);
                });
            });
        });
    });
});

module.exports = router;
