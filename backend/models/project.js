import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const projectSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    githubLink: String,
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

export default model('Project', projectSchema);
