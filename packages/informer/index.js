const express = require('express');

const { Telegraf } = require('telegraf');
const { serializeError } = require('serialize-error');

const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const fs = require('fs');

const app = express();

app.use(bodyParser.json());

dotenv.config();

const INFORMER_HOST = process.env.INFORMER_HOST || "0.0.0.0";
const INFORMER_PORT = process.env.INFORMER_PORT || 1337;
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const CHANNEL_ID = process.env.BOT_CHANNEL_ID || '@theoneinformer';

const bot = new Telegraf(BOT_TOKEN);
const sendMsg = async (msg = '') => await bot.telegram.sendMessage(CHANNEL_ID, msg);

app.post('/api/v1/do_inform', (req, res, next) => {

    const {
        symbol = 'ETHUSDT',
        trend,
    } = req.body;

    if (trend === "upward") {
        sendMsg(`Symbol ${symbol} will grow in several minutes`)
    }

    if (trend === "downward") {
        sendMsg(`Symbol ${symbol} will fall in several minutes`)
    }

    res.json({ status: 'ok' });
});

app.get('/api/v1/do_inform', (_, res) => {
    res.json({
        timestamp: Date.now(),
    });
});

bot.on('message', (ctx) => {
  const { chat } = ctx;
  const { id } = chat;
  ctx.reply(`Hello there, chatId${id}`);
});

bot.launch()
    .then(() => app.listen(INFORMER_PORT, INFORMER_HOST))
    .then(() => {
        console.log(`informer started on port ${INFORMER_PORT}`)
    });

process.once('uncaughtException', function (err) {
    fs.appendFileSync('./error.log', JSON.stringify(serializeError(err), null, 2));
    bot.stop('SEGFAULT');
    process.exit(-1);
});

process.once('unhandledRejection', (error) => {
    throw error;
});

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
