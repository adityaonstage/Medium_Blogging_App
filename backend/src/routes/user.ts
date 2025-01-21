import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { Hono } from 'hono'
import { signupInput, signinInput } from '@adityaonstage/medium-common-mod'

export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL : string;
      JWT_SECRET : string;
    }
}>()


userRouter.post('/signup', async(c) => {
    const body = await c.req.json();
    const { success } = signupInput.safeParse(body);
	  console.log(success)
	  if(!success){
		  c.status(411);
		  return c.json({
			  msg: "Inputs are incorrect"
		  })
	  }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
        
    try {
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: body.password,
          name:     body.name
        }
      }) 
      console.log("1");
      const jwt = await sign({
        id: user.id
      },c.env.JWT_SECRET)
      return c.text(jwt)
    }
    catch(e) {
      c.status(411);console.log(e);
      return c.text('invaliddd');
    }
  
    return c.text('Hello Hono!')
  })
  
  userRouter.post('/signin', async(c) => {
    const body = await c.req.json();
    const { success } = signinInput.safeParse(body);
	  if(!success){
		  c.status(411);
		  return c.json({
			  msg: "Inputs are incorrect"
		  })
	  }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try {
      const user = await prisma.user.findFirst({
        where: {
          email: body.username,
          password: body.password,
        }
      }) 
  
      if(!user) {
        c.status(403);
        return c.json({
          message: "Incorrect credentials"
        })
      }
      const jwt = await sign({
        id: user.id
      },c.env.JWT_SECRET)
      return c.text(jwt)
    }
    catch(e) {
      c.status(411);console.log(e)
      return c.text('invalid')
    }
  
  
  
    return c.text('hello hono') 
  })
