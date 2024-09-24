const { Telegraf } = require('telegraf');
const axios = require('axios');
const keepAlive = require('./keep_alive.js');


const bot = new Telegraf(process.env['token']);

bot.on(['document', 'photo', 'audio', 'video'], async (ctx) => {
    const file = ctx.message.document || ctx.message.photo?.[ctx.message.photo.length - 1] || ctx.message.audio || ctx.message.video;
    
    if (file) {
        const fileSize = file.file_size / (1024 * 1024); // Convert to MB
        
        if (fileSize > 50) {
            await ctx.reply(`⚠️ الملف بحجم: ${fileSize.toFixed(2)} ميجا بايت.\nالحجم المسموح هو 50 ميجا بايت ⛔️`);
        } else {
            try {
                const fileLink = await ctx.telegram.getFileLink(file.file_id);
                await ctx.reply(`📎 هذا هو الرابط الخاص بالملف:\n${fileLink}`);
            } catch (error) {
                await ctx.reply('❌ حدث خطأ أثناء جلب الرابط، حاول مرة أخرى لاحقاً.');
            }
        }
    } else {
        await ctx.reply('🚫 لم أتمكن من التعرف على الملف.');
    }
});
keepAlive();
bot.launch();