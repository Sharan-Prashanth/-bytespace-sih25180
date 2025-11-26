export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has any of the required roles
    const hasRole = roles.some(role => req.user.roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles.includes('SUPER_ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is committee member
export const isCommitteeMember = (req, res, next) => {
  const committeeRoles = ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'];
  const hasCommitteeRole = req.user && req.user.roles.some(role => committeeRoles.includes(role));
  
  if (!hasCommitteeRole) {
    return res.status(403).json({
      success: false,
      message: 'Committee member access required'
    });
  }
  next();
};

// Check if user is reviewer
export const isReviewer = (req, res, next) => {
  if (!req.user || !req.user.roles.includes('EXPERT_REVIEWER')) {
    return res.status(403).json({
      success: false,
      message: 'Reviewer access required'
    });
  }
  next();
};
