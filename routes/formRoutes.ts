import express, { NextFunction, Request, Response } from 'express' 
import { body, check, validationResult } from 'express-validator';
import { createNewForm, editForm, editQuestion, getForm, getQuestion } from '../controllers/formController';
var router = express.Router();
import auth from '../middleware/auth'
import Form, { IForm, IFormStored } from '../models/form';
import Question, { IQuestion, IQuestion_b } from '../models/question';

/* GET home page. */
router.post('/',
  body('title').isString().isLength({max:100,min:3}),
  body('desc').optional().isString().isLength({max:150}),
  body('starttime').optional().isDate(),
  body('endtime').optional().isDate(),

  (req: Request, res: Response, next: NextFunction)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()})
    }
    next()
  },
  auth,
  createNewForm
);

router.put('/:formId',
  body('title').optional().isString().isLength({max:100,min:3}),
  body('desc').optional().isString().isLength({max:150}),
  body('starttime').optional().isDate(),
  body('endtime').optional().isDate(),

  body('questions').exists().isArray({max:20}),
  body('new_questions').exists().isArray({max:20}),
  // body('delete_questions').exists().isArray({max:20}),
  
  body('new_questions.*.required').isBoolean().exists(),
  body('new_questions.*.title').isString().isLength({min:3,max:150}),
  body('new_questions.*.desc').isString().optional().isLength({max:150}),
  body('new_questions.*.ans_type').exists().isIn(['short_ans', 'long_ans', 'mcq', 'checkbox', 'dropdown', 'mcq_grid', 'checkboc_grid', 'range', 'date', 'time']),
  body('new_questions.*.optionsArray').optional().isArray({max:20,min:1}),
  body('new_questions.*.optionsArray.*').optional().isString().isLength({min:1,max:50}),
  body('new_questions.*.correct_ans').optional().isArray({max:20,min:1}),
  body('new_questions.*.correct_ans.*').optional().isString().isLength({min:1,max:50}),
  body('new_questions.*.point').optional().isInt({max:100,min:0}),

  body('new_questions').custom((value : IQuestion_b[],{req,path})=>{
    let check=true;
    value.forEach((question)=>{
      const { ans_type,optionsArray, correct_ans } = question
      if(optionsArray && correct_ans && (ans_type==="checkbox" || ans_type==="mcq" || ans_type==="dropdown")){
        if(!correct_ans.every(r => optionsArray.includes(r))){
          check=false
          throw new Error("Correct Ans don't match with optionsArray")
        }
      }else if(!optionsArray){
        if(ans_type==="checkbox" || ans_type==="mcq" || ans_type==="dropdown"){
          check=false;
          throw new Error("Ans type demands an optionsArray")
        }
      }else if(optionsArray){
        if(!(ans_type==="checkbox" || ans_type==="mcq" || ans_type==="dropdown")){
          check=false;
          throw new Error("Ans type don't need an optionsArray")
        }
      }
    })
    
    if(!check){
      throw new Error("Check the questions!")
    }else{
      return value
    }
  }),

  (req: Request, res: Response, next: NextFunction)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()})
    }
    next()
  },
  auth,
  editForm
);
router.get('/:formId',
  auth,
  getForm
);

router.get('/:formId/q/:queId',
  auth,
  getQuestion
);
router.put('/:formId/q/:queId',
  body('required').isBoolean().exists(),
  body('title').isString().isLength({min:3,max:150}),
  body('desc').isString().optional().isLength({max:150}),
  body('ans_type').exists().isIn(['short_ans', 'long_ans', 'mcq', 'checkbox', 'dropdown', 'mcq_grid', 'checkboc_grid', 'range', 'date', 'time']),
  body('optionsArray').optional().isArray({max:20,min:1}),
  body('optionsArray.*').optional().isString().isLength({min:1,max:50}),
  body('correct_ans').optional().isArray({max:20,min:1}).custom((value : string[],{req,path})=>{
    let optionsArray : string[] = req.body.optionsArray
    if(!value.every(r => optionsArray.includes(r))){
      throw new Error("Correct Ans don't match with optionsArray")
    }else{
      return value
    }
  }),
  body('correct_ans.*').optional().isString().isLength({min:3,max:50}),
  body('point').optional().isInt({max:100,min:0}),
  
  (req: Request, res: Response, next: NextFunction)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()})
    }
    next()
  },
  auth,
  editQuestion
);
export default router