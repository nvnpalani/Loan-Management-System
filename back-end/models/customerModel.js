const db = require("../database/database");

const addCustomer = (customer, callback) => {

    const sql = `
        INSERT INTO customers
        (customer_id, name, area, phone, address, work, photo, document, start_date, duration, loan_amount, interest, collected_amount, pending_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            customer.customer_id,
            customer.name,
            customer.area,
            customer.phone,
            customer.address,
            customer.work,
            customer.photo,
            customer.document,
            customer.start_date,
            customer.duration,
            customer.loan_amount,
            customer.interest || 0,
            customer.collected_amount,
            customer.pending_amount
        ],
        function (err) {
            callback(err, this.lastID);
        }
    );
};

const getAllCustomers = (callback) => {
    const sql = `
        SELECT 
            c.*, 
            COALESCE(SUM(CASE WHEN coll.status = 'Paid' THEN coll.amount ELSE 0 END), 0) as real_collected,
            (c.loan_amount + (c.loan_amount * c.interest / 100) - COALESCE(SUM(CASE WHEN coll.status = 'Paid' THEN coll.amount ELSE 0 END), 0)) as real_pending
        FROM customers c
        LEFT JOIN collections coll ON c.customer_id = coll.customer_id
        GROUP BY c.customer_id
    `;

    db.all(sql, [], (err, rows) => {
        const finalRows = rows ? rows.map(r => ({
            ...r,
            collected_amount: r.real_collected,
            pending_amount: r.real_pending
        })) : [];
        callback(err, finalRows);
    });
};

const deleteCustomer = (id, callback) => {
    db.run("DELETE FROM collections WHERE customer_id IN (SELECT customer_id FROM customers WHERE id = ? OR customer_id = ?)", [id, id], () => {
        const sql = "DELETE FROM customers WHERE id = ? OR customer_id = ?";
        db.run(sql, [id, id], function (err) {
            callback(err, this.changes);
        });
    });
};

const updateCustomer = (id, customer, callback) => {
    const sql = `
        UPDATE customers
        SET name = ?, area = ?, phone = ?, address = ?, work = ?, photo = ?, document = ?, start_date = ?, duration = ?, loan_amount = ?, interest = ?, collected_amount = ?, pending_amount = ?
        WHERE id = ? OR customer_id = ?
    `;
    db.run(
        sql,
        [
            customer.name,
            customer.area,
            customer.phone,
            customer.address,
            customer.work,
            customer.photo,
            customer.document,
            customer.start_date,
            customer.duration,
            customer.loan_amount,
            customer.interest || 0,
            customer.collected_amount,
            customer.pending_amount,
            id,
            id
        ],
        function (err) {
            callback(err, this.changes);
        }
    );
};

module.exports = {
    addCustomer,
    getAllCustomers,
    updateCustomer,
    deleteCustomer
};