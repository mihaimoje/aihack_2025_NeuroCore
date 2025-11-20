import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'manager', 'developer', 'tester'], required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    githubUsername: String,
    githubToken: String,
    githubRepos: [String],
}, { timestamps: true });

export default model('User', userSchema);