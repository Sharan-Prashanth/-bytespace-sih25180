import express from 'express';
import axios from 'axios';

const router = express.Router();

const PYTHON_API_URL = process.env.PYTHON_MODEL_URL || 'http://localhost:8000';

router.post('/chat', async (req, res) => {
    try {
        const { question, top_k = 10 } = req.body;

        if (!question) {
            return res.status(400).json({ 
                message: 'Question is required' 
            });
        }

        const response = await axios.post(
            `${PYTHON_API_URL}/chat`,
            { question, top_k }
        );

        res.json(response.data);
    } catch (error) {
        console.error('RAG chat error:', error.message);
        res.status(500).json({ 
            message: 'Failed to get answer',
            error: error.response?.data || error.message 
        });
    }
});

export default router;
