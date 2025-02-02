const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../controllers/middleware');
const { createPost, getAllPosts } = require('../controllers/postController');
const { upload, multerMemory } = require('../config/multerConfig'); 


router.post('/create', authenticateToken,  multerMemory.single('image'), createPost);

router.get('/fetch-all', authenticateToken, getAllPosts);

module.exports = router;
