const TelegramApi = require('node-telegram-bot-api')

const sequelize = require('./db')

const UserModel = require('./models');

const token = '6476677019:AAHArIcvZAnnvDIY5lBSf_y8tIXrtvP3noU'

const bot = new TelegramApi(token, {polling: true})

const {gameOptions, againOptions} = require('./options')

const chats = {};

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, `Сейчас я загадаю цифру от 0 до 9, а ты должен ее угадать`)
    const randomNumber = Math.floor(Math.random() *  10);
    chats[chatId] = randomNumber
    await bot.sendMessage(chatId, 'Отгадывай', gameOptions);
}

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync();
    } catch (e) {
        console.log('Подключение к бд сломалось', e)
    }
    bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/info', description: 'Получить информацию о пользователе'},
        {command: '/game', description: 'Начать игру'}
    ])

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        try {
            if(text === '/start') {
                let stringChatId = chatId.toString()
                let user = await UserModel.findOne({ where: { chatId: stringChatId } });

                if (!user) {
                    user = await UserModel.create({ chatId });
                }
                await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/7.jpg');
                return bot.sendMessage(chatId, 'Добро пожаловать');
            }

            if(text === '/info') {
                let stringChatId = chatId.toString()
                const user = await UserModel.findOne({stringChatId})
                return  bot.sendMessage(
                    chatId,
                    `Тебя зовут ${msg.from.first_name} ${msg.from.last_name}, 
                     в игре у тебя правильных ответов ${user.right}, неправильных ${user.wrong}`
                )
            }

            if (text === '/game') {
                return startGame(chatId);
            }
            return  bot.sendMessage(chatId, `Я тебя не понимаю попробуй еще раз`)
        } catch (e) {
            return bot.sendMessage(chatId, `Произошла какая то ошибка! ${e} dddd ${chatId}`)
        }
    })

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;
        if (data === '/again') {
           return startGame(chatId);
        }

        let stringChatId = chatId.toString();
        const user = await UserModel.findOne({where: {chatId: stringChatId}})
        if (data == chats[chatId]) {
            user.right += 1;
            await bot.sendMessage(chatId, `Поздравляю, ты отгадал цифру ${chats[chatId]}`, againOptions)
        } else {
            user.wrong += 1;
            await bot.sendMessage(chatId, `К сожелению ты не угадал, бот загадал цифру ${chats[chatId]}`, againOptions)
        }

        await user.save();
    })
}

start()