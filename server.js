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
  console.log(`Received search request for query: ${query}`);
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
    console.log('API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('API request error:', error);
    res.status(500).send(error.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
