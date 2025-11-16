// 1. Import necessary packages
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 2. Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3001;

// 3. Setup Middleware
app.use(cors());
app.use(express.json()); // This replaces body-parser for JSON

// 4. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// ... THE REST OF YOUR SERVER.JS REMAINS THE SAME ...
// (The Product Schema, the app.get, app.post routes, and app.listen are all correct)

// 5. Define the Product Schema and Model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  price: Number,
  stock: Number,
  image: String,
  description: String,
});
const Product = mongoose.model('Product', productSchema);

// 6. Define API Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error creating product', error });
  }
});
app.put('/api/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error updating product', error });
    }
});
app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
});

// 7. Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});