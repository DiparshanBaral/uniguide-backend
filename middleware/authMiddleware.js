const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Import the User model

const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the header

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the user from the database and attach it to the request object
        const user = await User.findById(decoded.id).select('-password'); // Exclude the password field
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        req.user = user; // Attach the user object to the request
        next(); // Proceed to the next middleware/route
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, invalid token' });
    }
};

module.exports = { protect };