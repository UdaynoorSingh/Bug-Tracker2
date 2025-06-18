// middleware/auth.js
const jwt =require('jsonwebtoken');
const User =require('../models/User');

const auth = async(req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if(!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const user = await User.findById(decoded.userId);
    if(!user)return res.status(401).json({message: 'User not found' });

    req.user = { userId: user._id, name: user.name, email: user.email };
    req.token = token;
    next();
  } 
  catch(error){
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message:'Invalid token'});
    }
    res.status(401).json({message:'Authentication failed'});
  }
};

module.exports = auth;