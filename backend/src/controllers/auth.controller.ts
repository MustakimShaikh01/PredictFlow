import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendWelcomeEmail } from '../services/email.service';

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  });

const signRefresh = (id: string) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  });

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department } = req.body;
    const exists = await User.findOne({ email });
    if (exists) { res.status(400).json({ message: 'Email already registered' }); return; }

    const user = await User.create({ name, email, password, role: role || 'employee', department });
    await sendWelcomeEmail(email, name);

    const token = signToken(user.id);
    const refreshToken = signRefresh(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({ success: true, token, refreshToken, user });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' }); return;
    }

    const token = signToken(user.id);
    const refreshToken = signRefresh(user.id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ success: true, token, refreshToken, user });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: rToken } = req.body;
    if (!rToken) { res.status(401).json({ message: 'No refresh token' }); return; }

    const decoded = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== rToken) {
      res.status(403).json({ message: 'Invalid refresh token' }); return;
    }

    const token = signToken(user.id);
    res.json({ success: true, token });
  } catch {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: rToken } = req.body;
    if (rToken) {
      const decoded = jwt.decode(rToken) as { id: string };
      await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
    }
    res.json({ success: true, message: 'Logged out' });
  } catch {
    res.status(500).json({ message: 'Logout failed' });
  }
};
