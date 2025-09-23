// services/leadAssignment.js
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const User = require('../models/User');

/**
 * Assign a lead to the best salesperson within a company.
 * Rule:
 *   1) Prefer salespersons with < 10 active leads (active = not dropped/booking_done)
 *   2) Otherwise assign to the least-loaded salesperson (tie -> earliest created)
 */
async function assignLeadToSalesperson(companyId, session = null) {
  // Salespersons in company
  const salespersons = await User.find({
    role: 'salesperson',
    companyId,
    isActive: true
  }).select('_id createdAt').sort({ createdAt: 1 });

  if (!salespersons.length) return null;

  const salespersonIds = salespersons.map(s => s._id);

  // Count active leads per salesperson
  const activeCounts = await Lead.aggregate([
    { $match: { assignedTo: { $in: salespersonIds }, status: { $nin: ['booking_done', 'dropped'] } } },
    { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
  ]);

  const countMap = new Map(activeCounts.map(c => [String(c._id), c.count]));

  // Partition by < 10 and >= 10
  const underTen = [];
  const others = [];
  for (const sp of salespersons) {
    const cnt = countMap.get(String(sp._id)) || 0;
    (cnt < 10 ? underTen : others).push({ id: sp._id, cnt });
  }

  const pickLeast = (arr) =>
    arr.sort((a, b) => a.cnt - b.cnt)[0]?.id || null;

  return pickLeast(underTen.length ? underTen : others.length ? others : []);
}

module.exports = { assignLeadToSalesperson };
