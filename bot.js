require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  throw new Error("Telegram Bot Token not provided!");
}

const bot = new TelegramBot(TOKEN, { polling: true });

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

function jaccardSimilarity(str1, str2) {
  const set1 = new Set(str1.toLowerCase().split(' '));
  const set2 = new Set(str2.toLowerCase().split(' '));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

bot.onText(/\/search (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];
  console.log(`Received /search command with query: ${query}`);
  try {
    const response = await axios.post('http://localhost:3000/search', { query });
    console.log('API response in bot:', response.data);

    let products = response.data.products || [];

    products = products.map(product => ({
      ...product,
      similarity: jaccardSimilarity(query, product.title)
    })).sort((a, b) => b.similarity - a.similarity);

    products = products.slice(0, 20);

    if (products.length === 0) {
      bot.sendMessage(chatId, 'No items found.');
      return;
    }

    let replyChunks = ['Here are the items I found:\n'];
    products.forEach((product, index) => {
      const price = product.price ? `${product.price.value} ${product.price.currency}` : 'Price not available';
      const itemInfo = `${index + 1}. ${product.title} - ${price}\nURL: ${product.url}\n\n`;

      if ((replyChunks[replyChunks.length - 1] + itemInfo).length > 4096) {
        replyChunks.push('');
      }
      replyChunks[replyChunks.length - 1] += itemInfo;
    });

    for (const chunk of replyChunks) {
      await bot.sendMessage(chatId, chunk);
    }

    for (const product of products) {
      const photo = product.thumbnail;
      const caption = `${product.title}\nPrice: ${product.price ? `${product.price.value} ${product.price.currency}` : 'Price not available'}\nURL: ${product.url}`;
      await bot.sendPhoto(chatId, photo, { caption });
    }
  } catch (error) {
    console.error('Error processing /search command:', error);
    bot.sendMessage(chatId, `Error: ${error.toString()}`);
  }
});
