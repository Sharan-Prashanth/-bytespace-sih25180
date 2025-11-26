import Activity from '../models/Activity.js';

class ActivityLogger {
  /**
   * Log user activity
   */
  async log({ user, action, proposalId = null, details = {}, ipAddress = null }) {
    try {
      await Activity.create({
        user: user._id || user,
        action,
        proposalId,
        details,
        ipAddress
      });
    } catch (error) {
      console.error('Activity logging error:', error);
      // Don't throw error - logging failure shouldn't break the main flow
    }
  }

  /**
   * Get user activities
   */
  async getUserActivities(userId, limit = 50) {
    try {
      return await Activity.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('proposalId', 'proposalCode title status')
        .lean();
    } catch (error) {
      console.error('Get user activities error:', error);
      return [];
    }
  }

  /**
   * Get proposal activities
   */
  async getProposalActivities(proposalId, limit = 100) {
    try {
      return await Activity.find({ proposalId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'fullName email roles')
        .lean();
    } catch (error) {
      console.error('Get proposal activities error:', error);
      return [];
    }
  }

  /**
   * Get recent activities (for admin dashboard)
   */
  async getRecentActivities(limit = 100, filters = {}) {
    try {
      const query = {};
      
      if (filters.action) {
        query.action = filters.action;
      }
      
      if (filters.userId) {
        query.user = filters.userId;
      }
      
      if (filters.proposalId) {
        query.proposalId = filters.proposalId;
      }

      return await Activity.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'fullName email roles')
        .populate('proposalId', 'proposalCode title status')
        .lean();
    } catch (error) {
      console.error('Get recent activities error:', error);
      return [];
    }
  }
}

export default new ActivityLogger();
