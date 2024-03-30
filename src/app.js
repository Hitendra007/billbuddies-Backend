
import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,

})) //.use is used for all middlewares
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"))
app.use(cookieParser())
//routes import 
import userRouter from './routes/user.routes.js'
import friendRouter from './routes/friends.routes.js'
import groupRouter from './routes/group.routes.js'
import individualRouter from './routes/indivdual.routes.js'

app.use('/api/v1/users', userRouter)
app.use('/api/v1/friend/', friendRouter)
app.use('/api/v1/group/', groupRouter)
app.use('/api/v1/individual/',individualRouter)
export { app }