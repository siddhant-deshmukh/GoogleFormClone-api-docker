import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken'
import User from '../models/users';

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.GoogleFormClone_acesstoken;

    // console.log("req.cookies.access_token",req.cookies.GoogleFormClone_acesstoken,process.env.TOKEN_KEY || 'zhingalala');
    // console.log("Coming")
    if (!token) {
      return res.status(401).json({ err: "Not authorized!", user:null });
    }
    const decoded = jwt.verify(token, process.env.TOKEN_KEY || 'zhingalala');
    if (typeof decoded === 'string' || !decoded._id) {
      res.clearCookie("access_token");
      return res.status(403).json({ err: "Something is wrong with verification!", user:null });
    }
    const user = await User.findById(decoded._id).select({ 'password': 0,  'auth_type': 0 });
    if (!user) {
      res.clearCookie("access_token");
      return res.status(403).json({ err: "A token is required for authentication", user:null });
    }

    res.user = user;
  } catch (err) {
    return res.status(403).json({ err: "A token is required for authentication", user:null });
  }
  return next();
};

export default verifyToken;