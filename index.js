const express = require('express')
const cors = require('cors')
const {MongoClient, ServerApiVersion, ObjectId} = require('mongodb')
require('dotenv').config()
const app = express()
const port = 5000;

// middleWare
app.use(express.json())
app.use(cors())

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
        await client.connect();
        const articlesCollection = client.db('KnowledgeShare').collection('allArticles')
        const articlesLikeCollection = client.db('KnowledgeShare').collection('articleLike')
        

        app.get('/articles', async(req, res)=>{

            const email = req.query.email;

            const user = {}
            if(email){
                user.email = email;
            }

            const result = await articlesCollection.find(user).toArray()
            res.send(result)
        })

        app.get('/articles/:id', async(req, res)=>{
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

        app.get('/article/like/:articleId', async(req, res)=>{
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


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally{

    }
}
run().catch(console.dir)

app.get('/', (req, res)=>{
    res.send('Knowledge Share Server Active')
})

app.listen(port, ()=>{
    console.log(`The Server Run on Port ${port}`);
})




