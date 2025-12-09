import express from 'express';
import axios from 'axios';

const router = express.Router();

const PYTHON_API_URL = process.env.PYTHON_MODEL_URL || 'http://localhost:8000';

// Chat about user proposals
router.post('/chat-proposals', async (req, res) => {
    try {
        const { question, user_id, proposal_id } = req.body;

        if (!question) {
            return res.status(400).json({ 
                message: 'Question is required' 
            });
        }

        const response = await axios.post(
            `${PYTHON_API_URL}/chat-proposals`,
            { question, user_id, proposal_id }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Proposal chat error:', error.message);
        res.status(500).json({ 
            message: 'Failed to get answer about proposals',
            error: error.response?.data || error.message 
        });
    }
});

// Get user proposals
router.get('/proposals/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const response = await axios.get(
            `${PYTHON_API_URL}/proposals/${userId}`
        );

        res.json(response.data);
    } catch (error) {
        console.error('Get proposals error:', error.message);
        res.status(500).json({ 
            message: 'Failed to fetch proposals',
            error: error.response?.data || error.message 
        });
    }
});

export default router;
