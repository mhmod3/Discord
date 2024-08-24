const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const keepAlive = require('./keep_alive.js');

// ضع توكن البوت الخاص بك هنا
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel], // تمكين "partials" للقنوات الخاصة
});

const translateStatus = (status) => {
    switch (status.toLowerCase()) {
        case 'finished':
            return 'مُكتمل';
        case 'releasing':
            return 'مُستمر';
        case 'not_yet_released':
            return 'لم يُعرض بعد';
        case 'cancelled':
            return 'ملغي';
        default:
            return 'أخرى';
    }
};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

let listening = false;
let processingImage = false;
let cooldown = false;

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // التحقق من أن الرسالة تأتي من الخاص
    if (message.guild) {
        return message.reply("❌ يرجى التوجه للخاص.");
    }

    // التحقق من فترة التبريد
    if (cooldown) {
        return message.channel.send("⚠️ يرجى الانتظار 16 ثانية قبل إعادة استخدام البوت.");
    }

    // إذا تم إرسال الأمر !start
    if (message.content === '!start' && !listening) {
        listening = true;
        message.channel.send("🕒 سأستمع إلى الصور لمدة 1 دقيقة...");

        // تعيين مؤقت لمدة 1 دقيقة
        setTimeout(() => {
            listening = false;
            message.channel.send("⏲️ انتهت المدة! لن أستمع إلى الصور بعد الآن.");
        }, 60000); // 60000 ميلي ثانية تساوي 1 دقيقة
    } else if (message.content === '!start' && listening) {
        return message.channel.send("🔄 يتم الاستماع للصور بالفعل.");
    }

    // التعامل مع الصور المرسلة
    if (listening && message.attachments.size > 0) {
        if (processingImage) {
            return message.channel.send("⚠️ جاري معالجة صورة بالفعل، يرجى الانتظار.");
        }

        processingImage = true;

        const attachment = message.attachments.first();
        const fileUrl = attachment.url;

        try {
            message.channel.send("📸 جاري معالجة الصورة...");

            // استدعاء API موقع trace.moe
            const traceMoeResponse = await axios.get('https://api.trace.moe/search', {
                params: {
                    url: fileUrl
                }
            });

            const traceData = traceMoeResponse.data.result[0];

            if (!traceData.anilist) {
                throw new Error("لم يتم العثور على ID الخاص بـ AniList.");
            }

            const anilistId = traceData.anilist;

            // استدعاء API موقع AniList للحصول على تفاصيل الأنمي
            const anilistResponse = await axios.post('https://graphql.anilist.co', {
                query: `
                query ($id: Int) {
                    Media(id: $id, type: ANIME) {
                        title {
                            romaji
                            english
                            native
                        }
                        status
                        startDate {
                            year
                        }
                    }
                }
                `,
                variables: {
                    id: anilistId
                }
            });

            const animeData = anilistResponse.data.data.Media;
            const titles = [animeData.title.romaji, animeData.title.english, animeData.title.native].filter(Boolean);
            const mainTitle = titles.shift();
            const otherTitles = titles.map(title => `\`${title}\``).join('، ');

            const status = translateStatus(animeData.status);
            const year = animeData.startDate.year;

            const messageContent = `
📺 *اسم الأنمي:* \`${mainTitle}\`
*أسماء أخرى:* \n${otherTitles}
🎥 *الحالة:* ${status}
📅 *سنة الإنتاج:* ${year}
🕒 *الحلقة:* ${traceData.episode}
⏱ *الوقت:* ${new Date(traceData.from * 1000).toISOString().substr(11, 8)}

هذه ليس الانمي الذي تبحث عنه؟ \nأذن توجه هنا : \`https://shorturl.at/lDMF3\`\n\nقد تكون هذه النتائج غير صحيحة.`;

            const videoUrl = traceData.video;
            const tempFileName = `${uuidv4()}.mp4`;
            const videoPath = path.join(__dirname, tempFileName);

            const videoStream = await axios({
                url: videoUrl,
                responseType: 'stream'
            });

            videoStream.data.pipe(fs.createWriteStream(videoPath));

            await new Promise((resolve) => {
                videoStream.data.on('end', resolve);
            });

            await message.channel.send({ content: messageContent, files: [videoPath] });

            fs.unlinkSync(videoPath);

        } catch (error) {
            console.error('حدث خطأ: ', error.message);
            message.channel.send(`⚠️ حدث خطأ أثناء معالجة الصورة: ${error.message}`);
        } finally {
            processingImage = false;
            cooldown = true;

            // تفعيل فترة التبريد لمدة 16 ثانية
            setTimeout(() => {
                cooldown = false;
            }, 16000);
        }
    }
});

// بدء تشغيل البوت
keepAlive();
client.login( process.env['token']);
