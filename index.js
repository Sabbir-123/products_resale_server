const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const { query } = require('express')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 8000

// middlewares
app.use(cors())
app.use(express.json())

// Database Connection
const uri = "mongodb+srv://kenabacha:lAKsFvO61icXeVQe@cluster0.j4x9j8z.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized Access. Why are You Searching it?");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.DB_ACCESS_TOken, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}


async function run() {
  try {
    const categoryCollection = client.db("usedmobile").collection("mobile");
    const mobileCollection = client.db("usedmobile").collection("allmobilebycategory");

    const bookingsCollection = client.db("usedmobile").collection("bookings");
    const advertiseCollection = client.db("usedmobile").collection("advertise");
    const wishlistCollection = client.db("usedmobile").collection("wishlist");
    const usersCollection = client.db("usedmobile").collection("users");
    const sellersCollection = client.db("usedmobile").collection("sellers");
    const paymentsCollection = client.db("usedmobile").collection("payments");
   

    // const verifyAdmin = async (req, res, next) => {
    //   console.log("inside verify", req.decoded.email);
    //   const decodedEmail = req.decoded.email;
    //   const query = { email: decodedEmail };
    //   const user = await usersCollection.findOne(query);
    //   if (user?.role !== "admin") {
    //     return res.status(403).send({ message: "Forbidden Access" });
    //   }
    //   next();
    // };


    app.get("/mobiles", async (req, res) => {
      const id= req.params.id;
      const query = {};
      const cursor = await categoryCollection.find(query).toArray();
      const bookingQuery =  { bookingId : id }  ;
      const email = req.query.email;
      const queryByEmailForSeller = { email: email };
      const bookings = await categoryCollection.find(queryByEmailForSeller).toArray();
      const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
      cursor.forEach(cur=> {
        const curBooked = alreadyBooked.filter(book=> book.bookingId === cur.bookingId)
      })

      res.send(cursor);
    });
    app.get("/mobiles/:id", async (req, res) => {
      const id = req.params.id;
      const result = {category_id: id};
      const cursor = await categoryCollection.find(result).toArray();
      res.send(cursor)
    });
    app.get("/addedbyseller", async (req, res) => {
      const email = req.query.email;
      const queryByEmailForSeller = { email: email };
      const bookings = await categoryCollection.find(queryByEmailForSeller).toArray();
      res.send(bookings)
    });

    app.post("/mobiles", verifyJWT,  async (req, res) => {
      const mobiles = req.body;
      const result = await categoryCollection.insertOne(mobiles);
      res.send(result);
    });
    // Advertise
    app.post("/advertise",  async (req, res) => {
      const mobiles = req.body;
      const id = mobiles._id;
      const query = {
        _id: ObjectId(id),
        stock:  mobiles.stock,
        email: mobiles.email }
      const filter = { _id: ObjectId(id)};
      const updatedDoc = {
        $set: {
          advertiesed: true,
        }
      }
      const updateFilter =await advertiseCollection.updateOne(filter, updatedDoc)
      const available = await advertiseCollection.find(query).toArray();
      if (available.length) {
        const message = `You already have a advertised for this item `;
        return res.send({ acknowledged: false, message });
      }
      console.log(available)
      const result = await advertiseCollection.insertOne(mobiles);
      res.send(result);
    });

    app.get('/advertise', async(req, res)=>{
      const query= {};
      const mobile= await advertiseCollection.find(query).toArray();
      res.send(mobile)

    })

    // Wishlist

    app.post("/wishlist",  async (req, res) => {
      const mobiles = req.body;
      const id = mobiles._id;
      
      const query = {
        _id: new ObjectId(id),
        email: mobiles.email }
        console.log(mobiles, id, query)
      const available = await wishlistCollection.find(query).toArray();
      if (available.length) {
        const message = `You already have wishlisted this item `;
        return res.send({ acknowledged: false, message });
      }
      console.log(available)
      const result = await wishlistCollection.insertOne(mobiles);
      res.send(result);
    });

    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      console.log(req.headers.authorization)
      // const decodedEmail = req.decoded.email;
      // if (email !== decodedEmail) {
      //   return res
      //     .status(403)
      //     .send({ message: "Forbidden Access from if " });
      // }
      const query = { email: email };
      const bookings = await wishlistCollection.find(query).toArray();
      res.send(bookings);
    });


    
    // app.get("/mobilesbycategory", async (req, res) => {
    //   const query = {};
    //   const cursor = await mobileCollection.find(query).toArray();
    //   res.send(cursor);
    // });


// Bookings
    app.get("/bookings",verifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(req.headers.authorization)
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ message: "Forbidden Access from if " });
      }
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        bookingId: booking.bookingId,
        email: booking.email,
      };
      const bookedAlready = await bookingsCollection.find(query).toArray();
      if (bookedAlready.length) {
        const message = `You already have a booking for ${booking.MobileName}, BookingID: ${booking.bookingId} `;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });


    // JWT
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user && user?.email) {
        const token = jwt.sign({ email }, process.env.DB_ACCESS_TOken, {
          expiresIn: "23h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "No Available Token For You" });
      
    });
    
  
    
//User   
    app.post("/usersall", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    });

    app.get('/users', async(req, res)=>{
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users)

      app.delete("/users/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await usersCollection.deleteOne(query);
        res.send(result);
      });
    })
    
    
  
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