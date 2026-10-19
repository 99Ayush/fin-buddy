// goals.js – simple in‑memory CRUD for financial goals
const express = require('express');
const router = express.Router();

// In‑memory store (reset on server restart)
let goals = [];
let nextId = 1;

// GET /goals – list all goals
router.get('/', (req, res) => {
  res.json({ status: 'ok', data: goals });
});

// POST /goals – create a new goal
router.post('/', (req, res) => {
  const { title, targetAmount, targetDate, currentSavings = 0 } = req.body;
  if (!title || !targetAmount || !targetDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const goal = { id: nextId++, title, targetAmount, targetDate, currentSavings };
  goals.push(goal);
  res.status(201).json({ status: 'created', data: goal });
});

// PUT /goals/:id – update a goal
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const goal = goals.find(g => g.id === id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  Object.assign(goal, req.body);
  res.json({ status: 'updated', data: goal });
});

// DELETE /goals/:id – remove a goal
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = goals.findIndex(g => g.id === id);
  if (index === -1) return res.status(404).json({ error: 'Goal not found' });
  goals.splice(index, 1);
  res.json({ status: 'deleted' });
});

module.exports = router;
