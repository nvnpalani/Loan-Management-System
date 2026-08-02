const fs = require('fs');

let content = fs.readFileSync('D:/Loan-Management-System/front-end/src/pages/Reports/Reports.jsx', 'utf8');

// Replace all numbers in <p> tags showing Totals
content = content.replace(/Total Customers : \d+/g, 'Total Customers : 0');
content = content.replace(/Total Loans : \d+/g, 'Total Loans : 0');
content = content.replace(/Total Loan Amount : ₹[\d,]+/g, 'Total Loan Amount : ₹0');
content = content.replace(/Total Collection : ₹[\d,]+/g, 'Total Collection : ₹0');
content = content.replace(/Total Pending : ₹[\d,]+/g, 'Total Pending : ₹0');
content = content.replace(/Total Expense : ₹[\d,]+/g, 'Total Expense : ₹0');
content = content.replace(/Total Investment : ₹[\d,]+/g, 'Total Investment : ₹0');
content = content.replace(/Profit Paid : ₹[\d,]+/g, 'Profit Paid : ₹0');
content = content.replace(/Total Profit to Distribute: ₹[\d,]+/g, 'Total Profit to Distribute: ₹0');

// Monthly and Yearly PL numbers
content = content.replace(/<span className="font-semibold[^>]*>₹[\d,]+<\/span>/g, '<span className="font-semibold text-gray-800">₹0</span>');
// Fix text colors for PL
content = content.replace(/<span className="font-semibold text-gray-800">₹0<\/span><\/div>\s*<div className="flex justify-between"><span className="text-gray-600">Interest Earned<\/span><span className="font-semibold text-green-600">₹0<\/span><\/div>/g, '<span className="font-semibold text-gray-800">₹0</span></div>\n                  <div className="flex justify-between"><span className="text-gray-600">Interest Earned</span><span className="font-semibold text-green-600">₹0</span></div>'); // Just brute-force replacing all ₹\d+ to ₹0
content = content.replace(/>₹[\d,]+</g, '>₹0<');

// Replace <tbody> contents with empty messages
const tbodyRegex = /<tbody className="divide-y divide-gray-200">([\s\S]*?)<\/tbody>/g;
let matchCount = 0;
content = content.replace(tbodyRegex, (match, p1) => {
    matchCount++;
    // The number of columns varies by table, let's just use colSpan="10" generically, or count <th> tags.
    // Actually, setting colSpan="10" is safe enough for most HTML tables as it will just span across all available columns.
    return `<tbody className="divide-y divide-gray-200">\n                  <tr><td colSpan="10" className="p-8 text-center text-gray-500">No data available</td></tr>\n                </tbody>`;
});

// Fix 50%, 30%, 20% in ShareDistribution
content = content.replace(/>\d+%</g, '>0%<');

fs.writeFileSync('D:/Loan-Management-System/front-end/src/pages/Reports/Reports.jsx', content, 'utf8');
console.log('Reports.jsx cleared.');
