const express = require('express');
const app = express();
const SSLCommerzPayment = require('sslcommerz-lts');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5000;
const { ObjectId } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mujahid.frqpuda.mongodb.net/?retryWrites=true&w=majority&appName=Mujahid`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const store_id = 'bazar6616ab1a02971'
const store_passwd = 'bazar6616ab1a02971@ssl'
const is_live = false //true for live, false for sandbox



async function run() {
  try {
    const ProductCollection = client.db("Bazar-BD").collection("Products");
    const ShopCollection = client.db("Bazar-BD").collection("ShopList");
    const AddCartCollection = client.db('Bazar-BD').collection('cart')
    const DiscountCollection = client.db('Bazar-BD').collection('Discount')
    const PaymentCollection = client.db('Bazar-BD').collection('Payment')
    const SuccessCollection = client.db('Bazar-BD').collection('Success')

      app.get('/addProducts', async (req, res) =>{
      const result = await ProductCollection.find().toArray();
      res.send(result);
    })


      app.get('/addProducts/:id', async (req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ProductCollection.findOne(query);
      res.send(result);
  });
      app.get('/productDiscount/:id', async (req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await DiscountCollection.findOne(query);
      res.send(result);
  });

      app.get('/productDiscount', async(req, res) =>{
      const result = await DiscountCollection.find().toArray();
      res.send(result);
    })



      app.get('/shop', async(req, res) =>{
      const result = await ShopCollection.find().toArray();
      res.send(result);
    })

      app.post('/addCart', async(req, res) =>{
      const user = req.body;
      const result = await AddCartCollection.insertOne(user);
      res.send(result)
    })

    app.get('/addCart/:email', async (req, res) =>{
      const email = req.params.email;
      const filter = {email : email}
      const result = await AddCartCollection.find(filter).toArray();
      res.send(result);
    })

    app.post('/payment', async(req, res) =>{
      const money = (req.body.payment);
      console.log(req.body.data);
      const tran_id = new ObjectId().toString();
      console.log(tran_id);
      const data = {
        total_amount: money,
        currency: 'BDT',
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:5173/dashboard/paid/${tran_id}`,
        fail_url: 'http://localhost:5173/dashboard/failed',
        cancel_url: 'http://localhost:5173/dashboard/cancel',
        ipn_url: 'http://localhost:5173/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Mujahid',
        cus_email: 'customer@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };
    // console.log(data);
     const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
     sslcz.init(data).then(apiResponse => {
          // Redirect the user to payment gateway
         let GatewayPageURL = apiResponse.GatewayPageURL
         res.send({ url: GatewayPageURL })
        console.log('Redirecting to: ', GatewayPageURL)
     });
     app.post('/dashboard/paid/:tranId', async(req, res) => {
      console.log('tranId', req.params.tran_id);
    });

    
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
  }
}
run().catch(console.dir);


app.get('/', (req,res) =>{
    res.send('BazarBD running server')
})

app.listen(port, () =>{
    console.log(`server is running on port ${port}`);
})