import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const insightSchema = new Schema({
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    workloadOverview: Schema.Types.Mixed,
    estimationVsReality: Schema.Types.Mixed,
    blockedTasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    githubSummary: Schema.Types.Mixed
}, { timestamps: true });

export default model('Insight', insightSchema);
