import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const burnoutSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, min: 0, max: 100 },
    week: Number,
    year: Number,
    factors: {
        commitsCount: Number,
        overtimeHours: Number,
        tasksInProgress: Number,
        aiChatCount: Number,
        missedDeadlines: Number
    }
}, { timestamps: true });

export default model('BurnoutScore', burnoutSchema);
