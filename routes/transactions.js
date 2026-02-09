const express = require('express');
const router = express.Router();

let transactions = [];
let transactionCounter = 1;

// GET all transactions
router.get('/', (req, res) => {
  const { startDate, endDate, type } = req.query;
  
  let filtered = [...transactions];
  
  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }
  
  if (startDate) {
    filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate));
  }
  
  if (endDate) {
    filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate));
  }
  
  res.json(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// CREATE transaction
router.post('/', (req, res) => {
  const transaction = {
    id: `TXN${String(transactionCounter++).padStart(6, '0')}`,
    ...req.body,
    date: new Date().toISOString(),
    status: 'COMPLETED'
  };
  
  transactions.push(transaction);
  res.status(201).json(transaction);
});

// GET transaction by ID
router.get('/:id', (req, res) => {
  const transaction = transactions.find(t => t.id === req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(transaction);
});

module.exports = router;
