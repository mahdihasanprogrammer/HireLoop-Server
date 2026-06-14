const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const applicationsCollection = database.collection("applications");
        const plansCollection = database.collection('plans');
        const subscriptionsCollection = database.collection('subscriptions');
        const userCollection = database.collection('user');

        app.get('/', (req, res) => {
            res.send('Hello World!');
        });


        /** -----------------jobs related apis------------------- */

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
            const { search, category, jobType, isRemote } = req.query;
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
                query.isRemote = isRemote === 'true';
            }

            const findJobs = await jobsCollection.find(query).toArray();
            res.send(findJobs || [])
        })

        // get single job  for jobDetailPage;
        app.get('/api/jobs/:id', async (req, res) => {
            const { id } = req.params;
            const result = await jobsCollection.findOne(
                { _id: new ObjectId(id) }
            )
            res.send(result || {})
        })


        /** -----------------applications related apis---------------- */

        // get application with verify by applicant id;
        app.get('/api/applications', async (req, res) => {
            const { applicantId, jobId } = req.query;
            const query = {};

            if (applicantId) {
                query.applicantId = applicantId
            }
            if (jobId) {
                query.jobId = jobId
            }

            const result = await applicationsCollection.find(query).sort({ createdAt: -1 }).toArray();
            res.send(result)
        })

        // add new application;
        app.post('/api/application', async (req, res) => {
            const application = req.body;
            const newApplication = {
                ...application,
                createdAt: new Date(),
            }
            const result = await applicationsCollection.insertOne(newApplication);

            res.send(result)
        })


        /**--------------------Company related apis------------------- */

        // create a new company;
        app.post('/api/company', async (req, res) => {
            const company = req.body;
            const newCompany = {
                ...company,
                createdAt: new Date(),
            }
            const result = await companiesCollection.insertOne(newCompany);
            res.send(result)
        })

        // get all companies for admin;
        app.get('/api/companies', async (req, res) => {
            const allCompany = await companiesCollection.find().toArray();
            res.send(allCompany)
        })

        // get recruiter companies;
        app.get("/api/my-companies", async (req, res) => {
            const { recruiterId } = req.query;
            const query = {};
            if (recruiterId) {
                query.recruiterId = recruiterId;
            }

            const result = await companiesCollection.findOne(query);


            res.send(result || {})
        })

        // update company status by admin;
        app.patch('/api/companies/:id', async (req, res) => {
            const { id } = req.params;
            const updateCompany = req.body;
            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status : updateCompany.status }
            }
            const result = await companiesCollection.updateOne(query, updateDoc)

            res.send(result)
        })


        /** ----------------Plans related apis---------------- */

        app.get('/api/plans', async (req, res) => {
            const query = {};
            if (req.query.planId) {
                query.planId = req.query.planId
            }

            const result = await plansCollection.findOne(query);
            res.send(result)
        })


        //   subscription related apis ;

        app.post('/api/subscriptions', async (req, res) => {
            const subscriptionData = req.body;
            const newSubscription = {
                ...subscriptionData,
                createdAt: new Date()
            }
            const result = await subscriptionsCollection.insertOne(newSubscription)

            // update the user plan information
            const filter = { email: subscriptionData.email };
            const updateDocument = {
                $set: {
                    plan: subscriptionData.planId
                }
            }

            const updateResult = await userCollection.updateOne(filter, updateDocument)
            res.send(updateDocument, updateResult)
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