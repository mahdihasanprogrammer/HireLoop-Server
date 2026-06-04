const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();


const app = express();
const port = 6500;

// Middleware
app.use(express.json());
app.use(cors())

// MongoDB URI
const uri = process.env.MONGODB_URI;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        // Connect to the "database"
        const database = client.db(process.env.DB_NAME);
        const jobsCollection = database.collection("jobs");

        app.get('/', (req, res) => {
            res.send('Hello World!');
        });

        // add new job;
        app.post('/api/jobs', async(req, res) => {
            const job = req.body;
            const result = await jobsCollection.insertOne(job);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await database.command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}


run().catch(console.dir);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});