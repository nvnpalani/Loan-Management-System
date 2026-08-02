const db = require("../database/database");

const getAllRevenues = (callback) => {
    const sql = `SELECT * FROM revenues ORDER BY id DESC`;
    db.all(sql, [], callback);
};

const addRevenue = (data, callback) => {
    const sql = `
        INSERT INTO revenues (revenue_id, date, source, description, amount)
        VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
        data.revenue_id, 
        data.date, 
        data.source, 
        data.description, 
        data.amount
    ];
    db.run(sql, params, function(err) {
        callback(err, this.lastID);
    });
};

const deleteRevenue = (id, callback) => {
    const sql = `DELETE FROM revenues WHERE id = ?`;
    db.run(sql, [id], callback);
};

module.exports = { getAllRevenues, addRevenue, deleteRevenue };
