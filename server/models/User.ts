import mongoose, { type Document, Schema } from "mongoose";

export interface IUser extends Document {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

const userSchema = new Schema<IUser>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
