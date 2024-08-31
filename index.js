const { Telegraf } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const keepAlive = require('./keep_alive.js');


const bot = new Telegraf(process.env['token']);
const OWNER_ID = 6371657768; // استبدل بـ 'YOUR_USER_ID'

bot.start((ctx) => {
    if (ctx.from.id === OWNER_ID) {
        ctx.reply('👋 مرحبًا! أرسل الرابط الذي تريد البحث فيه.');
    } else {
        ctx.reply('🚫 لا يمكنك استخدام هذا البوت.');
    }
});

bot.on('text', async (ctx) => {
    if (ctx.from.id !== OWNER_ID) {
        return; // تجاهل الرسائل من غير مالك البوت
    }

    const url = ctx.message.text;

    if (!url.startsWith('https://arabtoons.net/manga/')) {
        ctx.reply('🔗 يرجى إرسال رابط من موقع arabtoons.net فقط.');
        return;
    }

    try {
        const chapters = await getChaptersFromArabToons(url);

        if (chapters.length === 0) {
            ctx.reply('❌ لم يتم العثور على أي فصول.');
            return;
        }

        const filePath = path.join(__dirname, 'chapters.html');
        const writeStream = fs.createWriteStream(filePath);

        writeStream.write(`
            <!DOCTYPE html>
            <html lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>فصول المانجا</title>
                <style>
                    body {
                        background-color: #121212;
                        color: #ffffff;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        overflow-x: hidden;
                        overflow-y: auto;
                    }
                    h2 {
                        font-size: 24px;
                        margin: 20px 0;
                        text-align: center;
                        border-bottom: 3px solid #ffffff;
                        padding-bottom: 10px;
                        width: 100%;
                        max-width: 800px;
                        color: #ffffff;
                    }
                    img {
                        display: block;
                        width: 100vw;
                        height: auto;
                        margin: 0;
                        padding: 0;
                        border: none;
                        object-fit: contain;
                    }
                    .container {
                        width: 100vw; /* ملء عرض الشاشة بالكامل */
                        max-width: 100%;
                        margin: 0;
                        padding: 0;
                        text-align: center;
                    }
                    .fullscreen-button {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        background-color: #ffffff;
                        color: #121212;
                        border: none;
                        padding: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        border-radius: 5px;
                        z-index: 1000;
                        transition: opacity 0.3s ease, transform 0.3s ease;
                    }
                    .fullscreen-button.hidden {
                        opacity: 0;
                        pointer-events: none;
                    }
                    .fullscreen-button:focus {
                        outline: none;
                    }
                </style>
            </head>
            <body>
                <button id="fullscreen-button" class="fullscreen-button">شاشة كاملة</button>
                <div class="container">
        `);

        for (const chapter of chapters) {
            writeStream.write(`<h2>فصل ${chapter.title}</h2>`);

            const chapterResponse = await axios.get(chapter.url);
            const $ = cheerio.load(chapterResponse.data);

            $('div.page-break img.wp-manga-chapter-img').each((i, element) => {
                const imgSrc = $(element).attr('src').trim();
                writeStream.write(`<img src="${imgSrc}" alt="Chapter Image">`);
            });
        }

        writeStream.write(`
                </div>
                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        const fullscreenButton = document.getElementById("fullscreen-button");
                        fullscreenButton.addEventListener("click", () => {
                            if (!document.fullscreenElement) {
                                document.documentElement.requestFullscreen();
                                fullscreenButton.textContent = "إلغاء الشاشة الكاملة";
                            } else {
                                document.exitFullscreen();
                                fullscreenButton.textContent = "شاشة كاملة";
                            }
                        });

                        // Show/hide fullscreen button on scroll
                        let scrollTimeout;
                        window.addEventListener("scroll", () => {
                            fullscreenButton.classList.add("hidden");
                            clearTimeout(scrollTimeout);
                            scrollTimeout = setTimeout(() => {
                                fullscreenButton.classList.remove("hidden");
                            }, 2000);
                        });
                    });
                </script>
            </body>
            </html>
        `);

        writeStream.end();

        writeStream.on('finish', async () => {
            await ctx.replyWithDocument({ source: filePath });
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error(error);
        ctx.reply('❌ حدث خطأ أثناء محاولة الوصول إلى الرابط.');
    }
});

async function getChaptersFromArabToons(url) {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const chapters = [];
    $('ul.main.version-chap.no-volumn li.wp-manga-chapter').each((i, element) => {
        const chapterUrl = $(element).find('a').attr('href');
        chapters.push({ url: chapterUrl, title: $(element).text().trim() });
    });

    return chapters.reverse(); // ترتيب الفصول من الفصل 1 إلى الأخير
}
keepAlive();
bot.launch();