import CalendarNote from '../models/CalendarNote.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/calendar/notes
 * @desc    Get all calendar notes for the logged-in user
 * @access  Private
 */
export const getNotes = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  const query = { userId: req.user._id };
  
  // If month and year are provided, filter by them
  if (month && year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    
    query.date = { $gte: startDate, $lt: endDate };
  }
  
  const notes = await CalendarNote.find(query).sort({ date: 1, createdAt: 1 });
  
  // Group notes by date
  const notesByDate = {};
  notes.forEach(note => {
    if (!notesByDate[note.date]) {
      notesByDate[note.date] = [];
    }
    notesByDate[note.date].push({
      _id: note._id,
      content: note.content,
      createdAt: note.createdAt
    });
  });
  
  res.json({
    success: true,
    data: notesByDate
  });
});

/**
 * @route   GET /api/calendar/notes/:date
 * @desc    Get notes for a specific date
 * @access  Private
 */
export const getNotesByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  
  const notes = await CalendarNote.find({
    userId: req.user._id,
    date: date
  }).sort({ createdAt: 1 });
  
  res.json({
    success: true,
    data: notes.map(note => ({
      _id: note._id,
      content: note.content,
      createdAt: note.createdAt
    }))
  });
});

/**
 * @route   POST /api/calendar/notes
 * @desc    Add a new calendar note
 * @access  Private
 */
export const addNote = asyncHandler(async (req, res) => {
  const { date, content } = req.body;
  
  if (!date || !content) {
    return res.status(400).json({
      success: false,
      message: 'Date and content are required'
    });
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }
  
  const note = await CalendarNote.create({
    userId: req.user._id,
    date,
    content: content.trim()
  });
  
  res.status(201).json({
    success: true,
    data: {
      _id: note._id,
      date: note.date,
      content: note.content,
      createdAt: note.createdAt
    }
  });
});

/**
 * @route   PUT /api/calendar/notes/:id
 * @desc    Update a calendar note
 * @access  Private
 */
export const updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  const note = await CalendarNote.findOne({
    _id: id,
    userId: req.user._id
  });
  
  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }
  
  note.content = content.trim();
  await note.save();
  
  res.json({
    success: true,
    data: {
      _id: note._id,
      date: note.date,
      content: note.content,
      createdAt: note.createdAt
    }
  });
});

/**
 * @route   DELETE /api/calendar/notes/:id
 * @desc    Delete a calendar note
 * @access  Private
 */
export const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const note = await CalendarNote.findOneAndDelete({
    _id: id,
    userId: req.user._id
  });
  
  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
});
