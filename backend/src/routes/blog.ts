import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { Hono } from 'hono'
import { updateBlogInput, createBlogInput} from '@adityaonstage/medium-common-mod'

export const blogRouter = new Hono<{
    Bindings: {
      DATABASE_URL : string;
      JWT_SECRET : string;
    }
    Variables: {
        userId : string;
    }
}>()

blogRouter.use("/*", async(c, next) => {
    const authHeader = c.req.header("Authorization") || "";
    try {
    const user = await verify(authHeader, c.env.JWT_SECRET); //verify() extracts the payload and stores it in user if the verification is successful
    //@ts-ignore
    c.set("userId", user.id);    
    await next();
    } catch(err) {
        c.status(403);
        return c.json({
            message : "You are not logged in"
        });
    }

})




blogRouter.post('/', async(c) => {
    const body = await c.req.json();
    const { success } = createBlogInput.safeParse(body)
    if(!success){
        c.status(411);
        return c.json({
            msg: "Inputs are Incorrect"
        })
    }
    const authorId = c.get("userId");console.log(authorId);
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate());
    const blog = await prisma.blog.create({
        data: {
            content: body.content,
            title: body.content,
            authorId: Number(authorId)
        }
    })
    console.log('hii2')
    return c.json({
        id: blog.id
    }) 
  })
  



  blogRouter.put('/', async(c) => {
    const body = await c.req.json();
    const { success } = updateBlogInput.safeParse(body)
    if(!success){
        c.status(411);
        return c.json({
            msg: "Inputs are Incorrect"
        })
    }
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
    const blog = await prisma.blog.update({
        where: {
            id: body.id
        },
        data: {
            content: body.content,
            title: body.content,
        }
    })
    return c.text('Hello Hono!')
  })
  
  blogRouter.get('/bulk', async(c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL, 
  }).$extends(withAccelerate());
  const blogs = await prisma.blog.findMany({
      select:{
          content: true,
          title: true,
          id: true,
          author: {
              select: {
                  name: true
              }
          }
         
      }
  });

  return c.json({
      blogs
  })


    return c.text('Hello Hono!')
  })



  blogRouter.get('/:id', async(c) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    try {
      const blog = await prisma.blog.findFirst({
          where: {
              id: Number(id)
          },
          select: {
              id: true,
              title: true,
              content: true,
              author: {
                  select: {
                      name: true
                  }
              }
          }
      })
          return c.json({
              blog
          });
      } catch(e){
          c.status(411);
          return c.json({
              msg: "Error while fecthing the blog post"
          })
      }
  
  })
  

  