import mongoose from 'mongoose';

const calendarNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,  // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
calendarNoteSchema.index({ userId: 1, date: 1 });

const CalendarNote = mongoose.model('CalendarNote', calendarNoteSchema);

export default CalendarNote;
