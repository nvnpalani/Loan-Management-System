const db = require("../database/database");

// 1. Get all collections (Raw Data)
const getAllCollections = (callback) => {
    const sql = `
        SELECT coll.*, c.name as customer_name 
        FROM collections coll
        LEFT JOIN customers c ON coll.customer_id = c.customer_id
    `;
    db.all(sql, [], (err, rows) => {
        callback(err, rows);
    });
};

// 2. Get Filtered Collections (Aggregated Report)
const getFilteredCollections = (filters, callback) => {
    const today = new Date().toISOString().split('T')[0];
    let sql = `
        SELECT 
            c.customer_id, 
            c.name as customer_name, 
            c.area, 
            c.loan_amount, 
            c.interest, 
            c.duration,

            c.pending_days,
            (SELECT MAX(collection_date) FROM collections WHERE customer_id = c.customer_id AND status = 'Paid') as last_paid_date,
            (SELECT status FROM collections WHERE customer_id = c.customer_id AND collection_date = '${today}' ORDER BY id DESC LIMIT 1) as today_status,
            COALESCE(SUM(CASE WHEN coll.status = 'Paid' THEN coll.amount ELSE 0 END), 0) as total_paid,
            (c.loan_amount + (c.loan_amount * c.interest / 100) - COALESCE(SUM(CASE WHEN coll.status = 'Paid' THEN coll.amount ELSE 0 END), 0)) as pending_amount
        FROM customers c
        LEFT JOIN collections coll ON c.customer_id = coll.customer_id

    `;

    const params = [];
    const conditions = [];

    // Filter collections based on date if provided
    if (filters.startDate && filters.endDate) {
        conditions.push("coll.collection_date BETWEEN ? AND ?");
        params.push(filters.startDate, filters.endDate);
    }

    if (filters.area && filters.area !== 'All') {
        conditions.push("c.area = ?");
        params.push(filters.area);
    }


    if (filters.customer) {
        conditions.push("(c.customer_id LIKE ? OR c.name LIKE ?)");
        params.push(`%${filters.customer}%`, `%${filters.customer}%`);
    }
    


    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " GROUP BY c.customer_id";

    const havingConditions = [];
    if (filters.collectionStatus && filters.collectionStatus !== 'All') {
        if (filters.collectionStatus === 'Pending') {
            havingConditions.push("(today_status IS NULL OR today_status = 'Reverted')");
        } else {
            havingConditions.push("today_status = ?");
            params.push(filters.collectionStatus);
        }
    }

    if (havingConditions.length > 0) {
        sql += " HAVING " + havingConditions.join(" AND ");
    }

    db.all(sql, params, (err, rows) => {
        callback(err, rows);
    });
};

// 3. Get Summary Data
const getSummary = (area, callback) => {
    // total amount collected today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let sql = `
        SELECT 
            COALESCE(SUM(coll.amount), 0) as totalCollectedToday
        FROM collections coll
        LEFT JOIN customers c ON coll.customer_id = c.customer_id
        WHERE coll.collection_date LIKE ?
    `;
    const params = [`${today}%`];

    if (area) {
        sql += " AND c.area = ?";
        params.push(area);
    }

    db.get(sql, params, (err, row) => {
        if (err) {
            return callback(err, null);
        }

        callback(null, {
            todayCollection: row ? row.totalCollectedToday : 0,
            areaName: area || "All Areas",
            totalCollectedToday: row ? row.totalCollectedToday : 0
        });
    });
};

// 3.5 Get Customer History
const getCustomerHistory = (customerId, callback) => {
    const sql = `
        SELECT * 
        FROM collections 
        WHERE customer_id = ? 
        ORDER BY collection_date DESC, id DESC
    `;
    
    db.all(sql, [customerId], (err, rows) => {
        callback(err, rows);
    });
};

// Helper for Audit Logging
const logAudit = (userName, action, tableName, recordId, oldValue, newValue, reason) => {
    const sql = `INSERT INTO audit_logs (user_name, action, table_name, record_id, old_value, new_value, reason) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [userName, action, tableName, recordId, oldValue, newValue, reason], (err) => {
        if (err) console.error("Audit log failed:", err.message);
    });
};

// Auto-close loan logic removed

// 4. Add a collection (Paid) with Validation
const addCollection = (data, callback) => {
    const status = data.status || 'Paid';
    const amount = Number(data.amount);
    const collectionDate = data.collection_date;
    const today = new Date().toISOString().split('T')[0];

    // Basic Validations
    if (status === 'Paid' && amount <= 0) {
        return callback(new Error("Negative or zero amount is not allowed"));
    }
    if (collectionDate > today) {
        return callback(new Error("Future date collection is not allowed"));
    }

    // Check Balance and Duplicates
    const calcSql = `
        SELECT 
            c.loan_amount, 
            c.interest, 
            COALESCE(SUM(CASE WHEN coll.status = 'Paid' THEN coll.amount ELSE 0 END), 0) as total_paid
        FROM customers c
        LEFT JOIN collections coll ON c.customer_id = coll.customer_id
        WHERE c.customer_id = ?
        GROUP BY c.customer_id
    `;
    db.get(calcSql, [data.customer_id], (err, cust) => {
        if (err) return callback(err);
        
        if (cust && status === 'Paid') {
            const pending = cust.loan_amount + (cust.loan_amount * cust.interest / 100) - cust.total_paid;
            if (pending <= 0) {
                return callback(new Error("Cannot add collection. Balance is fully settled."));
            }
            if (amount > pending) {
                return callback(new Error(`Collection amount (₹${amount}) cannot exceed the pending balance (₹${pending})`));
            }
        }

        db.get(`SELECT id FROM collections WHERE customer_id = ? AND collection_date = ? AND status = 'Paid'`, [data.customer_id, collectionDate], (err, existing) => {
            if (err) return callback(err);
            if (existing && status === 'Paid') {
                return callback(new Error("Duplicate collection entry for today is not allowed"));
            }

            // Proceed to insert
            const sql = `
                INSERT INTO collections (collection_id, customer_id, collection_date, amount, remarks, status, payment_mode, employee_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.run(sql, [
                data.collection_id,
                data.customer_id,
                collectionDate,
                amount,
                data.remarks,
                status,
                data.payment_mode || 'Cash',
                'admin'
            ], function (err) {
                if (!err) {
                    logAudit("Admin", "Add Collection", "collections", this.lastID, "", `Amount: ${amount}`, data.remarks || "Daily Collection");

                }
                callback(err, this ? this.lastID : null);
            });
        });
    });
};

const markUnpaid = (data, callback) => {
    const sqlCollection = `
        INSERT INTO collections (collection_id, customer_id, collection_date, amount, remarks, status, employee_id)
        VALUES (?, ?, ?, 0, ?, 'Unpaid', 'admin')
    `;
    db.run(sqlCollection, [
        data.collection_id,
        data.customer_id,
        data.collection_date,
        data.remarks || 'Marked Unpaid'
    ], function (err) {
        if (err) return callback(err);
        
        // Increment pending days
        db.run(`UPDATE customers SET pending_days = pending_days + 1 WHERE customer_id = ?`, [data.customer_id], function(updateErr) {
            logAudit("Admin", "Mark Unpaid", "customers", data.customer_id, "", "Pending Days + 1", data.remarks || "Customer not paid");
            callback(updateErr, this ? this.changes : null);
        });
    });
};

// 5. Revert Today's Collection (Undo Logic - Replace Delete)
const revertTodayCollection = (customerId, reason, callback) => {
    const today = new Date().toISOString().split('T')[0];
    
    // First find the collection to see if it was Paid or Unpaid
    db.get(`SELECT * FROM collections WHERE customer_id = ? AND collection_date = ? ORDER BY id DESC LIMIT 1`, [customerId, today], (err, row) => {
        if (err || !row) return callback(err || new Error("No collection found today"));
        
        const oldStatus = row.status;
        
        // Update status to 'Reverted'
        db.run(`UPDATE collections SET status = 'Reverted', remarks = ? WHERE id = ?`, [reason || 'Reverted by Admin', row.id], function(updateErr) {
            if (updateErr) return callback(updateErr);
            
            logAudit("Admin", "Revert Collection", "collections", row.id, oldStatus, "Reverted", reason);
            
            if (oldStatus === 'Unpaid') {
                // If we are reverting an Unpaid mark, decrement pending_days
                db.run(`UPDATE customers SET pending_days = MAX(0, pending_days - 1) WHERE customer_id = ?`, [customerId], (custErr) => {
                    callback(custErr, this.changes);
                });
            } else {
                callback(null, this.changes);
            }
        });
    });
};

// 6. Edit Today's Collection
const editTodayCollection = (customerId, data, callback) => {
    const today = new Date().toISOString().split('T')[0];
    const { amount, collection_date, remarks, payment_mode, reason } = data;
    
    if (!reason) {
        return callback(new Error("Reason is required for editing"));
    }

    db.get(`SELECT * FROM collections WHERE customer_id = ? AND collection_date = ? ORDER BY id DESC LIMIT 1`, [customerId, today], (err, row) => {
        if (err || !row) return callback(err || new Error("No collection found today to edit"));
        
        const newAmount = amount !== undefined ? Number(amount) : row.amount;

        // Check if new amount exceeds pending balance
        if (newAmount > row.amount) {
            const calcSql = `
                SELECT 
                    c.loan_amount, 
                    c.interest, 
                    COALESCE(SUM(CASE WHEN coll.status = 'Paid' THEN coll.amount ELSE 0 END), 0) as total_paid
                FROM customers c
                LEFT JOIN collections coll ON c.customer_id = coll.customer_id
                WHERE c.customer_id = ?
                GROUP BY c.customer_id
            `;
            db.get(calcSql, [customerId], (calcErr, calcRow) => {
                if (calcErr || !calcRow) return callback(calcErr || new Error("Error calculating balance"));
                
                const pending = calcRow.loan_amount + (calcRow.loan_amount * calcRow.interest / 100) - calcRow.total_paid;
                // Maximum they can add is the current pending amount + what they already paid today
                if (newAmount > (pending + row.amount)) {
                    return callback(new Error("Collection amount cannot exceed the pending balance"));
                }
                
                performEdit(row, newAmount);
            });
        } else {
            performEdit(row, newAmount);
        }

        function performEdit(row, newAmount) {
            logAudit("Admin", "Edit Collection", "collections", row.id, `Amount: ${row.amount}`, `Amount: ${newAmount}`, reason);
            
            const sql = `UPDATE collections SET amount = ?, collection_date = ?, remarks = ?, payment_mode = ? WHERE id = ?`;
            db.run(sql, [newAmount, collection_date || row.collection_date, remarks || row.remarks, payment_mode || row.payment_mode, row.id], function(updateErr) {
                if (updateErr) return callback(updateErr);
                

                callback(null, this.changes);
            });
        }
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
