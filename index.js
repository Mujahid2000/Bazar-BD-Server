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


const store_id = `${process.env.STORE_ID}`
const store_passwd = `${process.env.STORE_PASS}`
const is_live = false //true for live, false for sandbox



async function run() {
  try {
    const ProductCollection = client.db("Bazar-BD").collection("Products");
    const ShopCollection = client.db("Bazar-BD").collection("ShopList");
    const AddCartCollection = client.db('Bazar-BD').collection('cart')
    const DiscountCollection = client.db('Bazar-BD').collection('Discount')
    const PaymentCollection = client.db('Bazar-BD').collection('Payment')
    const UserCollection = client.db('Bazar-BD').collection('User');
    const WishlistCollection = client.db('Bazar-BD').collection('Wishlist');
    

      app.get('/addProducts', async (req, res) =>{
      const result = await ProductCollection.find().toArray();
      res.send(result);
    })

    app.put('/addProductsUpdate/:id', async (req, res) => {
      const productId = req.params.id;
      const filter = {_id : new ObjectId(productId)}
      const  {stock}  = req.body;
      console.log(typeof(stock));
      const updateData = {
        $set:{
          stock: stock
        }
      }
      const updateStock = await ProductCollection.findOneAndUpdate(filter, updateData);
      res.send(updateStock)
  });
  
  app.post('/')

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

      app.post('/productDiscount', async(req, res) =>{
      const product = req.body
      console.log(product);
      const result = await DiscountCollection.insertOne(product);
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

    // first payment

    app.post('/payment', async(req, res) =>{
      const myData = (req.body);
      const sendingData = (myData?.cart);
      const email = (myData.email);
      const money = (req.body.payment)
      const tran_id = new ObjectId().toString();
      const data = {
        total_amount: money,
        currency: 'BDT',
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `https://bazar-bd-server.vercel.app/dashboard/paid/${tran_id}`,
        fail_url: `https://bazar-bd-server.vercel.app/dashboard/failed/${tran_id}`,
        cancel_url: `https://bazar-bd-server.vercel.app/dashboard/cancel/${tran_id}`,
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Mujahid',
        cus_email: email,
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

    
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
    sslcz.init(data).then(apiResponse => {
      // Redirect the user to payment gateway
      let GatewayPageURL = apiResponse.GatewayPageURL
      res.send({ url: GatewayPageURL })
      // console.log('Redirecting to: ', GatewayPageURL)
    });
    
    
    const finalOrder = {
      sendingData,
      email,
      paidStatus: false,
      transactionId : tran_id
    }

    const orderCollection = await PaymentCollection.insertOne(finalOrder)

    app.post('/dashboard/paid/:tranId', async(req, res) => {
      const emailId = {email : email}
      const filter = { transactionId: req.params.tranId};

      const updateData = {
        $set: {
          packagePurchaseDate: new Date(),
          paidStatus: true,
          deliveryStatus: false,
          transactionId: req.params.tranId
        }
      }
      const orderCollection = await PaymentCollection.updateOne(filter, updateData);
      const deleteCart = await AddCartCollection.deleteMany(emailId)


    if(orderCollection.modifiedCount > 0){
      res.redirect(
      `https://bazar-bd-mujahid2000s-projects.vercel.app/dashboard/paid/${req.params.tranId}`
      )
    }
      
    });


    // if user fail payment
    app.post('/dashboard/failed/:tranId', async (req, res) => {
      const tranId = req.params.tranId
      console.log(tranId)
      res.redirect(
        `https://bazar-bd-mujahid2000s-projects.vercel.app/dashboard/failed/${req.params.tranId}`
      )
    })

    // if user cancel payment
    app.post('/dashboard/cancel/:tranId', async (req, res) => {
      const tranId = req.params.tranId
      console.log('cancel', tranId)
    })
    })

    // 2nd payment


    app.post('/myPayment', async(req, res) =>{
      const myData = (req.body);
      
      const sendingData = (myData?.cart);
      const email = (myData.email);
      const money = (req.body.payment)
      const tran_id = new ObjectId().toString();
      const data = {
        total_amount: money,
        currency: 'BDT',
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `https://bazar-bd-server.vercel.app/dashboard/paid/${tran_id}`,
        fail_url: `https://bazar-bd-server.vercel.app/dashboard/failed/${tran_id}`,
        cancel_url: `https://bazar-bd-server.vercel.app/dashboard/cancel/${tran_id}`,
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Mujahid',
        cus_email: email,
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

    
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
    sslcz.init(data).then(apiResponse => {
      // Redirect the user to payment gateway
      let GatewayPageURL = apiResponse.GatewayPageURL
      res.send({ url: GatewayPageURL })
      // console.log('Redirecting to: ', GatewayPageURL)
    });
    
    
    const finalOrder = {
      sendingData,
      email,
      paidStatus: false,
      transactionId : tran_id
    }

    const orderCollection = await PaymentCollection.insertOne(finalOrder)

    app.post('/dashboard/paid/:tranId', async(req, res) => {
      const emailId = {email : email}
      const filter = { transactionId: req.params.tranId};

      const updateData = {
        $set: {
          packagePurchaseDate: new Date(),
          paidStatus: true,
          deliveryStatus: false,
          transactionId: req.params.tranId
        }
      }
      const orderCollection = await PaymentCollection.updateOne(filter, updateData);
      

    if(orderCollection.modifiedCount > 0){
      res.redirect(
      `https://bazar-bd-mujahid2000s-projects.vercel.app/dashboard/paid/${req.params.tranId}`
      )
    }
      
    });


    // if user fail payment
    app.post('/dashboard/failed/:tranId', async (req, res) => {
      const tranId = req.params.tranId
      console.log(tranId)
      res.redirect(
        `https://bazar-bd-mujahid2000s-projects.vercel.app/dashboard/failed/${req.params.tranId}`
      )
    })

    // if user cancel payment
    app.post('/dashboard/cancel/:tranId', async (req, res) => {
      const tranId = req.params.tranId
      console.log('cancel', tranId)
    })
    })



    app.get('/order/:email', async (req, res) =>{
      const email = req.params.email;
      console.log(email);
      const filter = {email : email}
      const result = await PaymentCollection.find(filter).toArray();
      res.send(result);
    })


    app.post('/user', async (req, res) =>{
      const user = req.body;
      const result = await UserCollection.insertOne(user);
      res.send(result)
    })
    app.get('/user/:email', async (req, res) =>{
      const email = req.params.email;
      const filter = {email : email}
      const result = await UserCollection.findOne(filter);
      res.send(result)
    })


    app.get('/users', async (req, res) =>{
      const result = await UserCollection.find().toArray();
      res.send(result)
    })

    app.post('/wishlist', async(req, res) =>{
      const user = req.body;
      const result = await WishlistCollection.insertOne(user);
      res.send(result);
    })

    app.get('/wishlist/:email', async(req, res) =>{
      const email = req.params.email;
   
      const filter = {email : email};
      const result = await WishlistCollection.find(filter).toArray();
      res.send(result)
    })

    app.delete('/wishlist/:id', async(req, res) =>{
      const id = req.params.id;
     
      const filter ={ _id : new ObjectId(id)}
      const result = await WishlistCollection.deleteOne(filter);
      res.send(result)
    })

    app.get('/totalOrder', async(req, res) =>{
      const result = await PaymentCollection.find().toArray();
      res.send(result);
    })

    app.post('/uploadProduct', async(req, res) =>{
      const data = req.body;
      const result = await ProductCollection.insertOne(data);
      res.send(result);
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