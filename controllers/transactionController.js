const Transaction = require("../models/Transaction");

// helper to calculate latest wallet balance
const getLatestWallet = async () => {
  const lastTxn = await Transaction.findOne().sort({ createdAt: -1 });
  return lastTxn ? lastTxn.wallet : 0;
};

// Middleware to log request details
const logRequest = (req) => {
  console.log('=== REQUEST DETAILS ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Token present' : 'No token',
    'content-type': req.headers['content-type']
  });
  console.log('Body:', req.body);
  console.log('User:', req.user || 'No user in request');
  console.log('========================');
};

// Create transaction
exports.createTransaction = async (req, res) => {
  logRequest(req);
  try {
    const { date, time, type, amount, description, mode } = req.body;

    let wallet = await getLatestWallet();
    if (type === "incoming") wallet += Number(amount);
    if (type === "outgoing") wallet -= Number(amount);

    const txn = new Transaction({
      date,
      time,
      type,
      amount,
      description,
      mode,
      wallet,
    });

    await txn.save();
    res.status(201).json({ success: true, data: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get transactions with pagination & filter by date
exports.getTransactions = async (req, res) => {
  logRequest(req);
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    let filter = {};
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const [txns, total, latestTxn] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
      Transaction.findOne().sort({ createdAt: -1 })
    ]);

    const walletBalance = latestTxn ? latestTxn.wallet : 0;

    res.json({
      success: true,
      data: {
        transactions: txns,
        walletBalance
      },
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single transaction
exports.getTransactionById = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
  try {
    const { date, time, type, amount, description, mode } = req.body;
    const txn = await Transaction.findById(req.params.id);

    if (!txn) return res.status(404).json({ success: false, message: "Not found" });

    txn.date = date || txn.date;
    txn.time = time || txn.time;
    txn.type = type || txn.type;
    txn.amount = amount || txn.amount;
    txn.description = description || txn.description;
    txn.mode = mode || txn.mode;

    // recalculate wallet from scratch
    const allTxns = await Transaction.find().sort({ createdAt: 1 });
    let wallet = 0;
    for (let t of allTxns) {
      if (t._id.equals(txn._id)) {
        if (txn.type === "incoming") wallet += Number(txn.amount);
        if (txn.type === "outgoing") wallet -= Number(txn.amount);
        txn.wallet = wallet;
      } else {
        if (t.type === "incoming") wallet += Number(t.amount);
        if (t.type === "outgoing") wallet -= Number(t.amount);
        t.wallet = wallet;
        await t.save();
      }
    }

    await txn.save();
    res.json({ success: true, data: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findByIdAndDelete(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: "Not found" });

    // Recalculate wallet for all remaining transactions
    const allTxns = await Transaction.find().sort({ createdAt: 1 });
    let wallet = 0;
    for (let t of allTxns) {
      if (t.type === "incoming") wallet += Number(t.amount);
      if (t.type === "outgoing") wallet -= Number(t.amount);
      t.wallet = wallet;
      await t.save();
    }

    res.json({ success: true, message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
