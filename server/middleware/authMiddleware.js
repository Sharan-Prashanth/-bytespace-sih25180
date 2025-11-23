import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, no token provided' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-passwordHash');
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authorized, user not found' 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'Account is deactivated' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error in authentication' 
    });
  }
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log("User Info:", req.user);
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Check if user has any of the required roles
    const hasRequiredRole = roles.some(role => req.user.roles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        success: false, 
        message: `Your role(s) [${req.user.roles.join(', ')}] are not authorized to access this resource` 
      });
    }

    next();
  };
};

// Check if user owns the resource or has elevated privileges
export const authorizeOwnerOrRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Allow if user has one of the specified roles
    const hasRequiredRole = roles.some(role => req.user.roles.includes(role));
    if (hasRequiredRole) {
      return next();
    }

    // Allow if user owns the resource (for proposals)
    if (req.proposal && req.proposal.author.toString() === req.user._id.toString()) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: 'Not authorized to access this resource' 
    });
  };
};
