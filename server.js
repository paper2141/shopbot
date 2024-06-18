// 기존 코드와 동일한 파일을 수정합니다.
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/search', async (req, res) => {
  const { query, sortBy } = req.body;
  const apiUrl = `https://ebay32.p.rapidapi.com/search/${encodeURIComponent(query)}`;
  
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'x-rapidapi-key': '662b211a18mshd967c914cb7c5bbp14ad52jsne18f29da34a3',
        'x-rapidapi-host': 'ebay32.p.rapidapi.com'
      }
    });

    let products = response.data.products;

    // Sort products based on the selected criteria
    if (sortBy === 'priceAsc') {
      products = products.sort((a, b) => a.price.value - b.price.value);
    } else if (sortBy === 'priceDesc') {
      products = products.sort((a, b) => b.price.value - a.price.value);
    } else if (sortBy === 'reviews') {
      products = products.sort((a, b) => b.reviews - a.reviews);
    } else if (sortBy === 'sales') {
      products = products.sort((a, b) => b.sales - a.sales);
    }

    res.json({ products: products.slice(0, 20) });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error fetching products');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
