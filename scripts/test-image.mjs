import fs from 'fs'

const imagePath = './scripts/test-shoe.jpg'
const imageBase64 = fs.readFileSync(imagePath).toString('base64')

const response = await fetch('http://127.0.0.1:5001/boc-bot/us-central1/api/trpc/bot.ask?batch=1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    0: {
      query: 'What is the applicable tariff rate for this item?',
      image: imageBase64,
      history: [],
    },
  }),
})

const text = await response.text()
console.log('✅ Raw Response:', text)
