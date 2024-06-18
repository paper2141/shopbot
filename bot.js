const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const TOKEN = '7016857184:AAGErm1U9xWlKLWl9gDl4iBpBcy1vLUfsv4';
const bot = new TelegramBot(TOKEN, { polling: true });

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
    const response = await axios.post('https://vercel.com/papers-projects-7696558b/shopbot', { query });
    console.log('API response in bot:', response.data); // 봇에서도 응답 로그 추가

    let products = response.data.products || []; // products가 undefined일 경우 빈 배열로 설정

    // 각 제품의 제목과 검색어 간의 유사도를 계산하여 유사도 기준으로 정렬
    products = products.map(product => ({
      ...product,
      similarity: jaccardSimilarity(query, product.title)
    })).sort((a, b) => b.similarity - a.similarity);

    // 유사도가 높은 20개의 제품만 선택
    products = products.slice(0, 20);

    if (products.length === 0) {
      bot.sendMessage(chatId, 'No items found.');
      return;
    }

    let replyChunks = ['Here are the items I found:\n'];
    products.forEach((product, index) => {
      const price = product.price ? `${product.price.value} ${product.price.currency}` : 'Price not available';
      const itemInfo = `${index + 1}. ${product.title} - ${price}\nURL: ${product.url}\n\n`;

      // 현재 메시지에 itemInfo를 추가했을 때, 길이가 4096자를 초과하는지 확인
      if ((replyChunks[replyChunks.length - 1] + itemInfo).length > 4096) {
        // 초과하면 새 메시지를 시작
        replyChunks.push('');
      }
      // 현재 메시지에 itemInfo 추가
      replyChunks[replyChunks.length - 1] += itemInfo;
    });

    // 각 메시지를 개별적으로 전송
    for (const chunk of replyChunks) {
      await bot.sendMessage(chatId, chunk);
    }

    // 제품의 사진을 함께 보냄
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

bot.on("polling_error", (error) => {
  console.error(`Polling error: ${error.code} - ${error.message}`);
});
