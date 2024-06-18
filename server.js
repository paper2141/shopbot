const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const RAPIDAPI_KEY = '662b211a18mshd967c914cb7c5bbp14ad52jsne18f29da34a3';
const RAPIDAPI_HOST = 'ebay32.p.rapidapi.com';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/search', async (req, res) => {
  const { query, sortBy } = req.body;
  console.log(`Received search request for query: ${query}, sortBy: ${sortBy}`);
  
  const options = {
    method: 'GET',
    url: `https://${RAPIDAPI_HOST}/search/${encodeURIComponent(query)}?page=1&country=germany&country_code=de`,
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST
    }
  };

  try {
    const response = await axios.request(options);
    let products = response.data.products || [];

    // 정렬 처리
    if (sortBy === 'priceAsc') {
      products.sort((a, b) => (a.price ? a.price.value : Infinity) - (b.price ? b.price.value : Infinity));
    } else if (sortBy === 'priceDesc') {
      products.sort((a, b) => (b.price ? b.price.value : 0) - (a.price ? a.price.value : 0));
    } else if (sortBy === 'reviews') {
      products.sort((a, b) => (b.reviews ? b.reviews.count : 0) - (a.reviews ? a.reviews.count : 0));
    }

    console.log('API response:', products);
    res.json({ products });
  } catch (error) {
    console.error('API request error:', error);
    res.status(500).send(error.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
