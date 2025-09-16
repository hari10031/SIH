import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
const app = express();

const NODE_ENV = process.env.NODE_ENV || 'development';



const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

app.use(cors(corsOptions));




app.use(express.json({ 
  limit: '10mb'}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));


app.get('/', (req, res) => {
  res.status(400).json({
    message:"Backend is running !!"
  })
});

app.use('/auth',authRouter)



app.use('*', (req, res) => {
  res.status(401).json({
    message:"arey bhai ee route ledhu chusuko okasari url"
  })
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON';
  }
  
  res.status(status).json({
    error: message,
    ...(NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    }),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

export default app;