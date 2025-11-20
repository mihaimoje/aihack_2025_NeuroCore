import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const invitationSchema = new Schema({
    email: { type: String, required: true },
    role: { type: String, enum: ['developer', 'tester'], required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

export default model('Invitation', invitationSchema);
