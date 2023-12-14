const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");


const app = express();
dotenv.config();
const PORT = process.env.PORT || 3300;

const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;

mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.vp2htwj.mongodb.net/registrationFormDB`, {
    serverSelectionTimeoutMS: 5000,
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/Money tracker.html");
});

const transactionSchema = new mongoose.Schema({
    type: String,
    description: String,
    amount: Number,
    date: { type: Date, default: Date.now },
    balance: Number,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

app.use(express.json());

// Serve static files
app.use(express.static('public'));

// API endpoint to get transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find();

    // Separate arrays for income and expense transactions
    const incomeTransactions = transactions.filter(transaction => transaction.type === 'income');
    const expenseTransactions = transactions.filter(transaction => transaction.type === 'expense');

    // Calculate the balance for income transactions
    const incomeBalance = incomeTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);

    // Calculate the balance for expense transactions
    const expenseBalance = expenseTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);

    // Overall balance calculation (income - expense)
    const balance = incomeBalance - expenseBalance;

    // Update the balance field in the database for each transaction
    for (const transaction of transactions) {
      transaction.balance = balance;
      await transaction.save(); // Wait for the save to complete before moving to the next iteration
    }

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// API endpoint to add a new transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const newTransaction = new Transaction(req.body);
        await newTransaction.save();
        res.status(201).json(newTransaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
