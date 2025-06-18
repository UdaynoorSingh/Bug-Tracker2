// middleware/fileExists.js
const fs = require('fs');
const path = require('path');

module.exports = (req, res, next)=>{
  const filename = req.path.split('/').pop();
  const filePath = path.join(__dirname, '../uploads', filename);
  
  if (!fs.existsSync(filePath)){
    return res.status(404).json({message: 'File not found' });
  }
  next();
};