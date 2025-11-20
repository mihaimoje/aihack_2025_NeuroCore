import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const githubActivitySchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    commits: [{
        message: String,
        date: Date,
        sha: String
    }],
    pullRequests: [{
        title: String,
        url: String,
        state: String,
        openedAt: Date,
        closedAt: Date
    }],
    issues: [{
        title: String,
        url: String,
        state: String,
        openedAt: Date,
        closedAt: Date
    }],
    reviews: [{
        prUrl: String,
        state: String,
        submittedAt: Date
    }],
    lastSynced: Date
}, { timestamps: true });

export default model('GithubActivity', githubActivitySchema);
