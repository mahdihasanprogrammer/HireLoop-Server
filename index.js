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
        const companiesCollection = database.collection("companies");

        app.get('/', (req, res) => {
            res.send('Hello World!');
        });

        // add new job;
        app.post('/api/jobs', async (req, res) => {
            const job = req.body;
            const newJob = {
                ...job,
                createdAt: new Date()
            }
            const result = await jobsCollection.insertOne(newJob);
            res.send(result)
        })


        // get jobs
        app.get('/api/jobs', async (req, res) => {
            const { companyId, status } = req.query;
            const query = {};
            if (companyId) {
                query.companyId = companyId;
            }
            if (status) {
                query.status = status;
            }
            const findJobs = await jobsCollection.find(query).toArray();
            if (findJobs.length === 0) {
                return res.status(404).send({ message: "no job found" })
            }
            res.send(findJobs)
        })

        // get all jobs with filtering and search;
        app.get('/api/filtering-jobs', async (req, res) => {
            const { search, category, jobType, isRemote} = req.query;
            const query = {};
            console.log('query', req.query)

            if (search) {
                query.$or = [
                    { jobTitle: { $regex: search, $options: "i" } },
                    { companyName: { $regex: search, $options: "i" } }
                ];
            }

            if (category) {
                query.jobCategory = category;
            }
            if (jobType) {
                query.jobType = jobType;
            }
            if (isRemote) {
                query.isRemote = isRemote=== 'true';
            }

            const findJobs = await jobsCollection.find(query).toArray();
            console.log('findJobs', findJobs)

            res.send(findJobs || [])
        })


        /**--------------------Company related apis------------------- */

        // create a new company;
        app.post('/api/my-companies', async (req, res) => {
            const company = req.body;
            const newCompany = {
                ...company,
                createdAt: new Date(),
            }
            const result = await companiesCollection.insertOne(newCompany);
            res.send(result)
        })

        // ger recruiter companies;
        app.get("/api/my-companies", async (req, res) => {
            const { recruiterId } = req.query;
            const query = {};
            if (recruiterId) {
                query.recruiterId = recruiterId;
            }

            const result = await companiesCollection.findOne(query);
            console.log('result', result)
            if (!result) {
                return res.send({ status: 404, message: "no company found" })
            }
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