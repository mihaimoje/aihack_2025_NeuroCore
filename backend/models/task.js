import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const taskSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: String,
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['to-do', 'in-progress', 'done'], default: 'to-do' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    estimateHours: Number,
    realHours: Number, //adică durata dintre startedAt și completedAt.
    startedAt: Date,
    completedAt: Date,
    githubIssueNumber: Number, // GitHub issue number for sync
    githubIssueUrl: String // Direct link to GitHub issue
}, { timestamps: true });

export default model('Task', taskSchema);   
