const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found.' });
    res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.json({ testimonials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, role, content, rating } = req.body;
    if (!name || !role || !content) return res.status(400).json({ error: 'All fields are required.' });

    const testimonial = await Testimonial.create({ name, role, content, rating });
    res.status(201).json({ testimonial });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;