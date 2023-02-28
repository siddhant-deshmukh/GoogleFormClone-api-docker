import express, { NextFunction, Request, Response } from 'express' 
var router = express.Router();
import {  body,  validationResult } from 'express-validator';
import User, { IUser, IUserCreate, IUserStored } from '../models/users';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import auth from '../middleware/auth'
import {google} from "googleapis"
import dotenv from 'dotenv';
import QueryString from 'qs';
import axios from 'axios'
dotenv.config();

const googleClient = new google.auth.OAuth2(process.env.GoogleClientId,process.env.Google_Secret,"http://localhost:5173");
// console.log(process.env.GoogleClientId,process.env.Google_Secret)
/* GET home page. */
router.get('/', auth, function(req : Request, res : Response, next : NextFunction) {
  return res.status(201).json({ user : res.user });
});
router.post('/', auth, function(req : Request, res : Response, next : NextFunction) {
  res.send({ title: 'This is for GoogleForm' });
});

router.post('/register', 
  body('email').isEmail().isLength({max:50,min:3}).toLowerCase().trim(),
  body('name').isString().isLength({max:50,min:3}).trim(),
  body('password').isString().isLength({max:30,min:5}).trim(), 
  async function(req : Request, res : Response, next : NextFunction) {
    try{
      const {email,name,password} : {email:string,name:string,password:string}  = req.body;
      const checkEmail = await User.findOne({email});
      if(checkEmail) return res.status(409).json({msg:'User already exists!'});

      const encryptedPassword = await bcrypt.hash(password,15)

      const newUser : IUserStored = await User.create({
        email,
        name,
        password : encryptedPassword,
      })
      
      const token = jwt.sign({_id:newUser._id.toString(),email},process.env.TOKEN_KEY || 'zhingalala',{expiresIn:'2h'})
      res.cookie("GoogleFormClone_acesstoken",token)
      return res.status(201).json({token})
    } catch (err) {
      return res.status(500).json({msg : 'Some internal error occured',err})
    }
  }
);
router.post('/login-password',
  body('email').isEmail().isLength({max:50,min:3}),
  body('password').isString().isLength({max:30,min:5}), 
  async function(req : Request, res : Response, next : NextFunction) {
    const {email,password} : {email:string,password:string}  = req.body;
    const checkUser = await User.findOne({email});
    
    if(!checkUser) return res.status(404).json({msg:'User doesn`t exists!'});
    if(!checkUser.password) return res.status(405).json({msg:'Try another method'});
    if(!(await bcrypt.compare(password, checkUser.password))) return res.status(406).json({msg:'Wrong password!'}) ;

    const token = jwt.sign({_id:checkUser._id.toString(),email},process.env.TOKEN_KEY || 'zhingalala',{expiresIn:'2h'})
    res.cookie("GoogleFormClone_acesstoken",token)
    return res.status(201).json({token})
  }
);
router.post('/login-google', 
  async function(req : Request, res : Response, next : NextFunction) {
    try{
      const { code } = req.body
      // console.log(code)
      if(!code){
        console.log("No code given while using login-google");
        throw "code doesn't exist"
      }
      let { tokens } = await googleClient.getToken(code);    // get tokens
      if(!tokens || !tokens.access_token){
        console.log("Token not found for code",code);
        throw "token not found"
      }
      let oauth2Client = new google.auth.OAuth2();    // create new auth client
      oauth2Client.setCredentials({access_token: tokens.access_token});    // use the new auth client with the access_token
      let oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
      });
      let { data } = await oauth2.userinfo.get();    // get user info
      if(!data ){
        console.log("No user dound for token",tokens.access_token);
        throw "token not found"
      }
      // console.log(data);
      const {email,name,verified_email:emailVerfied  } = data 
      if(!email || !name || !emailVerfied){
        console.log("Error in data (Incomplete data found)",data);
        throw "Incomplete data found"
      }
      const checkUser = await User.findOne({email})
      let token = ""
      console.log(checkUser)
      if(checkUser && checkUser.email === email){
        if(checkUser.auth_type.findIndex((ele)=>(ele==='google')) === -1 ){
          checkUser.auth_type = [...checkUser.auth_type,'google']
          await checkUser.save()
        }
        token = jwt.sign({_id:checkUser._id.toString(),email},process.env.TOKEN_KEY || 'zhingalala',{expiresIn:'2h'})
        res.cookie("GoogleFormClone_acesstoken",token)
      }else{
        const newUser : IUserCreate = {
          email,
          name,
          emailVerfied,
          auth_type:['google'],
        }
        console.log("\n-------------------\nnewUser created!",newUser)
        const newUserCreated : IUserStored = await User.create(newUser)
        
        token = jwt.sign({_id:newUserCreated._id.toString(),email},process.env.TOKEN_KEY || 'zhingalala',{expiresIn:'2h'})
        res.cookie("GoogleFormClone_acesstoken",token)
      }

      return res.status(201).json({ token });


    }catch(err){
      // console.log(err)
      return res.status(500).json({msg : 'Some internal error occured',err})
    }
  }
);
router.get('/login-github', 
  async function(req : Request, res : Response, next : NextFunction) {
    try{
      const { code } = req.query
      console.log(code)
      console.log("--------- Here in login github ---------------------------")

      if(!code){
        console.log("No code error")
        // return res.redirect(`${process.env.Client_Url}&error=true`);
        throw "No code given"
      }

      const rootUrl = 'https://github.com/login/oauth/access_token';
      const options = {
        client_id: process.env.GithubClientId,
        client_secret: process.env.Github_Secret,
        code,
      };

      const queryString = QueryString.stringify(options);

      console.log("queryString",queryString)
      
      const { data } = await axios.post(`${rootUrl}?${queryString}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log("rootUrl with code",data)
      const { access_token } = QueryString.parse(data);

      // return decoded;
      console.log("access_token",access_token)
      if(!access_token){
        console.log("No access_token error")
        // return res.redirect(`${process.env.Client_Url}&error=true`);
        throw "No access_token while getting acess token"
      }

      const {data : email_data} = await axios.get(
        'https://api.github.com/user/emails',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      const {data : user_data} = await axios.get(
        'https://api.github.com/user',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      // return res.status(201).json(user_data_res);
      if(!user_data || !email_data ){
        console.log("while getting api user",user_data,email_data)
        throw "while getting api user"
      }
      // if( email_data.length < 1 ){
      //   console.log("while getting email data",email_data.isArray,email_data.length < 1)
      //   throw "while getting email data"
      // }
      //@ts-ignore
      const userEmail = (email_data.filter((email)=>email.primary))[0].email
      console.log("Email  :",userEmail)
      if((!userEmail) || typeof userEmail !== 'string'){
        console.log("Error getting primary email")
        throw "Error getting primary email"
      }
      const checkUser = await User.findOne({email:userEmail})
      let token = ""
      console.log(checkUser)
      if(checkUser && checkUser.email === userEmail){
        if(checkUser.auth_type.findIndex((ele)=>(ele==='github')) === -1 ){
          checkUser.auth_type = [...checkUser.auth_type,'github']
          await checkUser.save()
        }
        token = jwt.sign({_id:checkUser._id.toString(),email:userEmail},process.env.TOKEN_KEY || 'zhingalala',{expiresIn:'2h'})
        res.cookie("GoogleFormClone_acesstoken",token)
      }else{
        const newUser : IUserCreate = {
          email : userEmail,
          name : user_data.name || user_data.login || "unnamed",
          emailVerfied:true,
          auth_type:['github'],
          bio : user_data.bio
        }
        console.log("\n-------------------\nnewUser created!",newUser)
        const newUserCreated : IUserStored = await User.create(newUser)
        
        token = jwt.sign({_id:newUserCreated._id.toString(),email:userEmail},process.env.TOKEN_KEY || 'zhingalala',{expiresIn:'2h'})
        res.cookie("GoogleFormClone_acesstoken",token)
      }
      console.log({token})
      return res.status(201).json({token})
    } catch (err){
      console.log(`${process.env.Client_Url}&error=true`,"\n err in login github \n\n")
      return res.status(500).json({err,msg:"Internal error occured"})
    }
  }
);
router.get('/logout',async function(req : Request, res : Response, next : NextFunction) {
  try{
    console.log('cookie token', req.cookies.GoogleFormClone_acesstoken)
    res.cookie("GoogleFormClone_acesstoken",null)
    return res.status(201).json({msg:'Sucessfull!'})
  } catch (err) {
    return res.status(500).json({msg : 'Some internal error occured',err})
  }
})

export default router
