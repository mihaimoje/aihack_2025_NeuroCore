import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const teamSchema = new Schema({
    name: { type: String, required: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default model('Team', teamSchema);