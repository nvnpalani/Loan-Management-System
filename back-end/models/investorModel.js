const db = require("../database/database");

const getAllInvestors = (callback) => {
    const sql = `SELECT * FROM investors ORDER BY id DESC`;
    db.all(sql, [], callback);
};

const addInvestor = (data, callback) => {
    const sql = `
        INSERT INTO investors (investor_id, name, phone, investment_amount, profit_percent, profit_paid, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.investor_id, 
        data.name, 
        data.phone, 
        data.investment_amount, 
        data.profit_percent, 
        data.profit_paid || 0,
        data.status || 'Active'
    ];
    db.run(sql, params, function(err) {
        callback(err, this.lastID);
    });
};

const updateInvestor = (id, data, callback) => {
    const sql = `
        UPDATE investors 
        SET name = ?, phone = ?, investment_amount = ?, profit_percent = ?, profit_paid = ?, status = ?
        WHERE id = ?
    `;
    const params = [
        data.name, 
        data.phone, 
        data.investment_amount, 
        data.profit_percent, 
        data.profit_paid,
        data.status,
        id
    ];
    db.run(sql, params, callback);
};

const deleteInvestor = (id, callback) => {
    const sql = `DELETE FROM investors WHERE id = ?`;
    db.run(sql, [id], callback);
};

module.exports = { getAllInvestors, addInvestor, updateInvestor, deleteInvestor };
