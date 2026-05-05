require('dotenv').config()
const express = require('express')
const cors = require('cors')
const {MongoClient, ServerApiVersion, ObjectId} = require('mongodb')
const app = express()
const port = 5000;

// middleWare
app.use(express.json())
app.use(cors())

const admin = require("firebase-admin");
const serviceAccount = require("/knowledge-share-secrate.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// firebase token verify

const firebaseTokenVerify = async(req, res, next)=>{
    const authentication = req.headers?.authorization;

    if(!authentication || !authentication.startsWith('Bearer ')){
        return res.status(401).send({message: 'Unauthorization'})
    }
    const token = authentication.split(' ')[1]
    if(!token){
        return res.status(401).send({message: 'Unauthorization'})
    }
    try{
        const decoded = await admin.auth().verifyIdToken(token)
        
        req.decoded = decoded;
        next()
    } catch(error){
        return res.status(401).send({message: 'Unauthorized'})
    }
}

// email verify
const emailVerify = (req, res, next)=>{
    if(req.query.email !== req.decoded .email){
        return res.status(401).send({message: 'Unauthorized'})
    }
    next()
}

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.bki3sjk.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    try{
        // await client.connect();
        const articlesCollection = client.db('KnowledgeShare').collection('allArticles')
        const articlesLikeCollection = client.db('KnowledgeShare').collection('articleLike')
        const articlesCommentCollection = client.db('KnowledgeShare').collection('articleComment')
        // article comment like
        const articlesCommentLikeCollection = client.db('KnowledgeShare').collection('articleCommentLike')
        const articlesCommentReplyCollection = client.db('KnowledgeShare').collection('articleCommentReply')

        
        app.get('/articlesAll', async(req, res)=>{
            const result = await articlesCollection.find().toArray()
            res.send(result)
        })

        app.get('/articles',firebaseTokenVerify,emailVerify,  async(req, res)=>{

            const email = req.query.email;

            const user = {}
            if(email){
                user.email = email;
            }

            const result = await articlesCollection.find(user).toArray()
            res.send(result)
        })

        app.get('/articles/:id',firebaseTokenVerify, async(req, res)=>{
            const id = req.params.id;
            const objId = {_id: new ObjectId(id)}
            const result = await articlesCollection.findOne(objId);
            res.send(result)
        })

        app.post('/articles', async(req, res)=>{
            const data = req.body;
            const result = await articlesCollection.insertOne(data)
            res.send(result)
        })

        app.patch('/articles/:id', async(req, res)=>{
            const id = req.params.id;
            const idObj = {_id: new ObjectId(id)}
            const data = req.body;
            const filterData ={
                $set:{
                    title: data.title,
                    content: data.content,
                    thumbnailImage: data.thumbnailImage,
                    tags: data.tags
                }
            }
            const result = await articlesCollection.updateOne(idObj, filterData)
            res.send(result)
        })

        app.delete('/articles/:id', async(req, res)=>{
            const id = req.params.id;
            const objId = {_id: new ObjectId(id)}
            const result = await articlesCollection.deleteOne(objId)
            res.send(result)
        })

        // Like Section

        app.get('/article/like', async(req, res)=>{
            const result = await articlesLikeCollection.find().toArray()
            res.send(result)
        })

        app.get('/article/like/:articleId',firebaseTokenVerify, async(req, res)=>{
            const {articleId} = req.params;
            const objId = {articleId: articleId}
            const result = await articlesLikeCollection.find(objId).toArray()
            res.send(result)
        })

        app.post('/article/like', async(req, res)=>{
            const data =req.body;
            const result = await articlesLikeCollection.insertOne(data)
            res.send(result)
        })
        app.delete('/article/like/:id/:email', async(req, res)=>{
            const {id,email} = req.params;
            
            const result = await articlesLikeCollection.deleteOne({articleId: id, userEmail: email})
            res.send(result)
        })

        // comment Section

        app.get('/article/comment', async(req, res)=>{
            const result = await articlesCommentCollection.find().toArray()
            res.send(result)
        })

        app.get('/article/comment/:id',firebaseTokenVerify, async(req, res)=>{
            const id = req.params.id
            const articleId= {articleId: id}
            const result = await articlesCommentCollection.find(articleId).toArray()
            res.send(result)
        })

        app.post('/article/comment', async(req, res)=>{
            const data = req.body;
            const result = await articlesCommentCollection.insertOne(data);
            res.send(result)
        })

        // comment Like section
        app.get('/article/commentlike', async(req, res)=>{
            const result = await articlesCommentLikeCollection.find().toArray()
            res.send(result)
        })

        app.get('/article/commentlike/:id',firebaseTokenVerify, async(req, res)=>{
            const id = req.params.id
            const commentId= {commentId: id}
            const result = await articlesCommentLikeCollection.find(commentId).toArray()
            res.send(result)
        })

        app.post('/article/commentlike', async(req, res)=>{
            const data = req.body;
            const result = await articlesCommentLikeCollection.insertOne(data)
            res.send(result)
        })

        app.delete('/article/commentlike/:id/:email', async(req, res)=>{
            const {id,email} = req.params;
            const result = await articlesCommentLikeCollection.deleteOne({commentId: id, userEmail: email})
            res.send(result)
        })
        // comment Reply

        app.get('/article/commentreply', async(req, res)=>{
            const result = await articlesCommentReplyCollection.find().toArray()
            res.send(result)
        })

        app.get('/article/commentreply/:id',firebaseTokenVerify, async(req, res)=>{
            const id = req.params.id;
            const result = await articlesCommentReplyCollection.find({commentId: id}).toArray()
            res.send(result)
        })

        app.post('/article/commentreply', async(req, res)=>{
            const data = req.body;
            const result = await articlesCommentReplyCollection.insertOne(data)
            res.send(result)
        })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // ("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally{

    }
}
run().catch(console.dir)

app.get('/', (req, res)=>{
    res.send('Knowledge Share Server Active')
})

app.listen(port, ()=>{
    (`The Server Run on Port ${port}`);
})




