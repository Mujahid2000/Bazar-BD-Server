const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const SSLCommerzPayment = require('sslcommerz-lts');
const cors = require('cors');
require('dotenv').config();

// console.log(process.env.ACCESS_TOKEN_SECRET);

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
    

    
    app.post('/jwt', async (req, res) => {
      try {
        const user = req.body;
        console.log(user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
        res.send({ token });
      } catch (error) {
        res.status(500).send({ message: 'Error generating token', error });
      }
    });

    
    const verifyToken = (req, res, next) => {
      const token = req.headers.authorization;
      console.log(token);
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
      }
    
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
        req.user = decoded;
        next(); // Proceed to the next middleware
      });
    };
    
    // Protected route example
    app.get('/protected-route', verifyToken, (req, res) => {
      // If the token is verified, the user object is attached to the request
      // You can access it using req.user
      res.json({ message: 'You are authorized!', user: req.user });
    });

    // const verifyAdmin = async (req, res, next) =>{
    //   const email = req.decoded.email;
    //   const query = {email: email};
    //   const user = await UserCollection.findOne(query);
    //   const isAdmin = user?.role === 'admin';
    //   if(!isAdmin){
    //     return res.status(403).send({message: 'forbidden access'})
    //   }
    //   next();
    // }
  
    
    app.post('/user', async (req, res) =>{
      const user = req.body;
      const query = {email: user.email}
      const existingUser = await UserCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exist', insetId:null })
      }
      const result = await UserCollection.insertOne(user);
      res.send(result)
    })

    // app.post('/verify-token', (req, res) => {
    //   console.log('Request Body:', req.body);
    //   // Rest of the verification logic
    // });
    

    
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
    

    app.get('/addProducts', async (req, res) =>{
      const result = await ProductCollection.find().toArray();
      res.send(result);
    })

    app.delete('/products', async (req, res) => {
      const { ids } = req.body; // Assuming frontend sends an array of product IDs to delete, or a single ID
      
      try {
          const db = client.db('Bazar-BD'); // Replace 'your_database_name' with your actual database name
          const productsCollection = db.collection('Products'); // Assuming your collection name is 'products'
  
          if (Array.isArray(ids)) {
              // Convert string IDs to ObjectId for bulk delete
              const objectIds = ids.map(id => new ObjectId(id));
              // Delete multiple products from the MongoDB collection
              await productsCollection.deleteMany({ _id: { $in: objectIds } });
          } else {
              // Convert string ID to ObjectId for single delete
              const objectId = new ObjectId(ids);
              // Delete single product from the MongoDB collection
              await productsCollection.deleteOne({ _id: objectId });
          }
  
          res.status(200).json({ success: true, message: "Products deleted successfully" });
      } catch (error) {
          console.error("Error deleting products:", error);
          res.status(500).json({ success: false, error: "Failed to delete products" });
      }
  });

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
  
  // app.post('/')

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
      // console.log(product);
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

    app.get('/addCart/:email', async (req, res) => {
      const email = req.params.email;
      const myMail = req.params.email
      // Check if the requested user's email matches the authenticated user's email
      if (req.params.email !== email) {
        return res.status(403).json({ message: 'Forbidden: You are not authorized to access this resource' });
      }
    
      // Proceed to fetch the user's cart if the authorization is successful
      try {
        const filter = { email: email };
        const result = await AddCartCollection.find(filter).toArray();
        res.json(result);
      } catch (error) {
        console.error('Error fetching user cart:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

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
      `https://bazar-bd.vercel.app/dashboard/paid/${req.params.tranId}`
      )
    }
      
    });


    // if user fail payment
    app.post('/dashboard/failed/:tranId', async (req, res) => {
      const tranId = req.params.tranId
      console.log(tranId)
      res.redirect(
        `https://bazar-bd.vercel.app/dashboard/failed/${req.params.tranId}`
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
      // console.log(myData);
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



    app.get('/order/:email',async (req, res) =>{
      const email = req.params.email;
      // console.log(email);
      const filter = {email : email}
      const result = await PaymentCollection.find(filter).toArray();
      res.send(result);
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