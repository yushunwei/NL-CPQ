import { Router, Response } from 'express';
import { authService } from '../services/auth.service';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: '请填写完整信息' });
    }
    const result = await authService.register(email, password, name);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '请填写邮箱和密码' });
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getMe(req.userId!);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
