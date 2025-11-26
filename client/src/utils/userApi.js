import apiClient from './api';

/**
 * User API utilities
 * All endpoints for user management
 */

// Get all users (admin only)
export const getAllUsers = async (params = {}) => {
  try {
    const { page = 1, limit = 20, search, role } = params;
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(role && { role })
    });
    
    const response = await apiClient.get(`/api/users?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create user (admin only)
export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/api/users', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/api/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update user roles (admin only)
export const updateUserRoles = async (userId, roles) => {
  try {
    const response = await apiClient.put(`/api/users/${userId}/roles`, { roles });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get user activities
export const getUserActivities = async (userId, params = {}) => {
  try {
    const { page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams({ page, limit });
    
    const response = await apiClient.get(`/api/users/${userId}/activities?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRoles,
  getUserActivities
};
