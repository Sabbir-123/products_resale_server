const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 8000

// middlewares
app.use(cors())
app.use(express.json())

// Database Connection
const uri = "mongodb+srv://kenabacha:lAKsFvO61icXeVQe@cluster0.j4x9j8z.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
  try {
    const categoryCollection = client.db("usedmobile").collection("mobile");
    const mobileCollection = client.db("usedmobile").collection("allmobilebycategory");

    const bookingsCollection = client.db("usedmobile").collection("bookings");
    const usersCollection = client.db("usedmobile").collection("users");
    const sellersCollection = client.db("usedmobile").collection("sellers");
    const paymentsCollection = client.db("usedmobile").collection("payments");
   
    app.get("/mobiles", async (req, res) => {
      const query = {};
      const cursor = await categoryCollection.find(query).toArray();
      
      res.send(cursor);
    });
    app.get("/mobiles/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const result = {category_id: id};
      const cursor = await categoryCollection.find(result).toArray();
      res.send(cursor)
    });

    app.get("/mobilesbycategory", async (req, res) => {
      const query = {};
      const cursor = await mobileCollection.find(query).toArray();
      res.send(cursor);
    });


//Bookings
    // app.get("/bookings", async (req, res) => {
    //   const email = req.query.email;
    //   const decodedEmail = req.decoded.email;
    //   if (email !== decodedEmail) {
    //     return res
    //       .status(403)
    //       .send({ message: "Forbidden Access from if blockf " });
    //   }
    //   const query = { email: email };
    //   console.log(email);
    //   const bookings = await bookingsCollection.find(query).toArray();
    //   res.send(bookings);
    // });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        MobileName: booking.MobileName,
        name: booking.buyer,
        email: booking.email,
      };
      const bookedAlready = await bookingsCollection.find(query).toArray();
      if (bookedAlready.length) {
        const message = `You already have a booking ${booking.bookingTime}`;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });
    
  
  } finally {
  }
}

run().catch(err => console.error(err))

app.get('/', (req, res) => {
  res.send('Server is running...')
})

app.listen(port, () => {
  console.log(`Server is running on ${port}`)
})