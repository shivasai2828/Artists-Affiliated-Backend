const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv");
const transaction = require("./transactionModel");

app.use(cors());

app.use(express.json());

const PORT = 4000;
const dbConnect = () => {
  // Connecting to the database using the provided URL from the environment variables
  mongoose
    .connect(
      "mongodb+srv://shivasai:shivasai28@cluster0.dkxxazf.mongodb.net/expenses",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    // If the connection is successful, log a success message
    .then(() => console.log("DB CONNECTION SUCCESS"))
    // If there are issues connecting to the database, log an error message and exit the process
    .catch((err) => {
      console.log(`DB CONNECTION ISSUES`);
      console.error(err.message);
      process.exit(1);
    });
};
dbConnect();

app.listen(PORT, () => console.log("server running..."));

app.post("/add-transaction", async (req, res) => {
  const { description, amount, transactionType } = req.body;
  try {
    if (!description || !amount || !transactionType) {
      return res.status(400).send({
        status: 400,
        msg: "all fields are required {description, amount, transactionType}",
      });
    }

    if (isNaN(amount) || parseInt(amount) < 0) {
      return res
        .status(400)
        .send({ status: 400, msg: "please provide valid amount" });
    }

    const validTrns = ["credit", "debit"];

    if (!validTrns.includes(transactionType)) {
      return res
        .status(400)
        .send({ status: 400, msg: "please provide valid transaction type" });
    }

    const lastTransaction = await transaction.findOne().sort({ sequence: -1 });

    const balance = lastTransaction ? lastTransaction.runningBalance : 0;
    const newSequenceNumber = lastTransaction
      ? lastTransaction.sequence + 1
      : 1;

    const runningBalance =
      transactionType === "credit"
        ? parseInt(balance) + parseInt(amount)
        : parseInt(balance) - parseInt(amount);

    console.log(newSequenceNumber);

    const newTransaction = new transaction({
      sequence: newSequenceNumber,
      transactionDate: new Date(),
      description,
      amount: parseInt(amount),
      transactionType,
      runningBalance,
    });
    await newTransaction.save();
    res
      .status(200)
      .json({ status: 200, msg: "transaction added successfully" });
  } catch (err) {
    console.log(err.message);
    res.status(500).send(err.message);
  }
});

app.get("/transactions", async (req, res) => {
  try {
    const transactions = await transaction.find();

    res.status(200).send({
      status: 200,
      total: transactions.length,
      transactions,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
