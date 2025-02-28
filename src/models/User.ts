import mongoose from "mongoose";

export interface UserType extends Document {
  email: string;
  walletAddress: string;
  password: string;
  webhookUrl?: string;
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true },
  password: { type: String, required: true },
  webhookUrl: { type: String, required: false },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
