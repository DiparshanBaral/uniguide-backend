const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const Wallet = require("../models/walletModel");

const router = express.Router();

// Get wallet balance for a user
router.get("/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if the requesting user matches the wallet user or is an admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to wallet' });
    }
    
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return res.status(200).json({ 
        balance: 0,
        currency: 'usd',
        transactions: [] 
      });
    }
    
    res.status(200).json({
      balance: wallet.balance,
      currency: wallet.currency,
      transactions: wallet.transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

module.exports = router;