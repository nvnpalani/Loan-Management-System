const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/loan.db');

db.serialize(() => {
    db.all("SELECT * FROM investors", [], (err, rows) => {
        if (err) throw err;
        
        console.log(`Current investors: ${rows.length}`);
        let currentTotal = 0;
        rows.forEach(r => currentTotal += Number(r.investment_amount));
        console.log(`Current Total Amount: ${currentTotal}`);

        const targetTotal = 5000000;
        const amountToAdd = targetTotal - currentTotal;
        console.log(`Amount to add: ${amountToAdd}`);

        if (amountToAdd <= 0) {
            console.log("Already reached or exceeded 50 Lakhs.");
            return;
        }

        const numToAdd = 8;
        // Let's generate 8 random but realistic amounts that sum up to amountToAdd
        // We will distribute the amountToAdd into 8 chunks.
        
        // Random distribution algorithm that ensures exact sum:
        let parts = [];
        for (let i = 0; i < numToAdd; i++) {
            parts.push(Math.random());
        }
        const partsSum = parts.reduce((a, b) => a + b, 0);
        
        // Normalize and round to nearest 10,000
        let amounts = parts.map(p => Math.round((p / partsSum * amountToAdd) / 10000) * 10000);
        
        // Fix rounding errors so they add up exactly to amountToAdd
        let currentGeneratedTotal = amounts.reduce((a, b) => a + b, 0);
        let diff = amountToAdd - currentGeneratedTotal;
        
        // Add/subtract the difference to the first element
        amounts[0] += diff;

        // Shuffle amounts just in case
        amounts = amounts.sort(() => Math.random() - 0.5);

        const names = ["Ramesh", "Suresh", "Karthik", "Vijay", "Ajith", "Kamal", "Rajini", "Surya", "Vikram", "Dhanush"];
        
        const stmt = db.prepare("INSERT INTO investors (name, phone, investment_amount, profit_percent, profit_paid, status) VALUES (?, ?, ?, ?, ?, ?)");
        
        amounts.forEach((amt, i) => {
            const name = names[i % names.length] + " " + Math.floor(Math.random() * 100);
            const phone = "98" + Math.floor(10000000 + Math.random() * 90000000); // 10 digit
            const profit_percent = [5, 10, 15, 20][Math.floor(Math.random() * 4)];
            stmt.run(name, phone, amt, profit_percent, 0, 'Active');
        });

        stmt.finalize(() => {
            console.log("Successfully inserted 8 investors.");
            db.close();
        });
    });
});
