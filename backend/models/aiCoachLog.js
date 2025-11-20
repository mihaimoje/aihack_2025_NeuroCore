import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const aiCoachLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [{
        sender: { type: String, enum: ['user', 'ai'], required: true },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' }
}, { timestamps: true });

export default model('AiCoachLog', aiCoachLogSchema);
