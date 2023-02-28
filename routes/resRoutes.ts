import express, { NextFunction, Request, Response } from 'express'
import { body, check, validationResult } from 'express-validator';
import { createNewForm, editForm, editQuestion, getForm, getQuestion } from '../controllers/formController';
import { getFormRes, newFormRes } from '../controllers/resController';
var router = express.Router();
import auth from '../middleware/auth'
import Form, { IForm, IFormStored } from '../models/form';
import Question, { IQuestion } from '../models/question';

/* GET home page. */
router.post('/',
  body('formId').exists().isString(),
    
  body('questions','Check question array').isArray().exists().isLength({ max: 20, min:1 }),
  body('questions.*._id','Check question ID').exists().isString(),
  body('questions.*.ans_type','Check question ans_type').exists().isIn(['short_ans', 'long_ans', 'mcq', 'checkbox', 'dropdown', 'mcq_grid', 'checkboc_grid', 'range', 'date', 'time']),
  body('questions.*.res_array','Check question res_array').optional().isArray({ max: 50 }),
  body('questions.*.res_array.*','Check question res_array content').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('questions.*.res_text','Check question res_text').optional().isString().trim().isLength({ min: 1, max: 400 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  },

  auth,
  newFormRes
);

router.get('/f/:formId',
  auth,
  getFormRes
);

export default router