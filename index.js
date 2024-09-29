const fs = require('fs');
const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const keepAlive = require('./keep_alive.js');

const bot = new Telegraf(process.env['token']);

// مسار ملف بيانات المستخدمين
const userDataFile = path.join(__dirname, 'userData.json');

// تحميل بيانات المستخدمين أو تهيئة كائن فارغ
let userData = {};
if (fs.existsSync(userDataFile)) {
    userData = JSON.parse(fs.readFileSync(userDataFile));
} else {
    userData = {};
}

// قائمة الآيات القرآنية
const ayat = [
    "وَالَّذِينَ هُمْ لِفُرُوجِهِمْ حَافِظُونَ (5) إِلَّا عَلَىٰ أَزْوَاجِهِمْ أَوْ مَا مَلَكَتْ أَيْمَانُهُمْ فَإِنَّهُمْ غَيْرُ مَلُومِينَ (6) فَمَنِ ٱبْتَغَىٰ وَرَآءَ ذَٰلِكَ فَأُوْلَـٰٓئِكَ هُمُ ٱلْعَادُونَ (7)",
    "وَلَا تَقْرَبُوا الزِّنَىٰٓ إِنَّهُۥ كَانَ فَـٰحِشَةً وَسَآءَ سَبِيلًا",
    "وَلَا تَتَّبِعِ ٱلشَّهَوَٰتِ فَتَذِلَّ بِكَ عَن سَبِيلِ ٱللَّهِ",
    "وَمَن يُطِعِ ٱللَّهَ وَرَسُولَهُۥ يُدْخِلْهُ جَنَّـٰتٍۢ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَـٰرُ وَمَن يَتَوَلَّ يُعَذِّبْهُ عَذَابًا أَلِيمًۭا",
    "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا لَا تَتَّبِعُوا خُطُوَٰتِ ٱلشَّيْطَـٰنِ وَمَن يَتَّبِعْ خُطُوَٰتِ ٱلشَّيْطَـٰنِ فَإِنَّهُۥ يَأْمُرُ بِٱلْفَحْشَآءِ وَٱلْمُنكَرِ",
    "قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَـٰرِهِمْ وَيَحْفَظُوا فُرُوجَهُمْ ۚ ذَٰلِكَ أَزْكَىٰ لَهُمْ ۗ إِنَّ ٱللَّهَ خَبِيرٌۢ بِمَا يَصْنَعُونَ",
    "إِنَّ ٱللَّهَ يُحِبُّ ٱلتَّوَّـٰبِينَ وَيُحِبُّ ٱلْمُتَطَهِّرِينَ",
    "وَلَا تَقْفُ مَا لَيْسَ لَكَ بِهِۦ عِلْمٌ ۚ إِنَّ ٱلسَّمْعَ وَٱلْبَصَرَ وَٱلْفُؤَادَ كُلُّ أُو۟لَـٰٓئِكَ كَانَ عَنْهُۥ مَسْـُٔولًۭا",
    "وَمَن جَاهَدَ فَإِنَّمَا يُجَـٰهِدُ لِنَفْسِهِۦ ۚ إِنَّ ٱللَّهَ لَغَنِىٌّ عَنِ ٱلْعَـٰلَمِينَ",
    "وَٱصْبِرْ وَمَا صَبْرُكَ إِلَّا بِٱللَّهِ وَلَا تَحْزَنْ عَلَيْهِمْ وَلَا تَكُ فِى ضَيْقٍۢ مِّمَّا يَمْكُرُونَ",
    "إِنَّهُۥ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ",
    "وَٱسْتَعِينُوا بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى ٱلْخَـٰشِعِينَ",
    "فَٱصْبِرْ صَبْرًۭا جَمِيلًا",
    "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا ٱسْتَعِينُوا بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
    "إِنَّمَا يُوَفَّى ٱلصَّـٰبِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍۢ",
    "إِنَّ رَبَّكَ وَٱسِعُ ٱلْمَغْفِرَةِ",
    "فَتَلَقَّىٰٓ ءَادَمُ مِن رَّبِّهِۦ كَلِمَـٰتٍۢ فَتَابَ عَلَيْهِ ۚ إِنَّهُۥ هُوَ ٱلتَّوَّابُ ٱلرَّحِيمُ",
    "قُلْ يَـٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا ۚ إِنَّهُۥ هُوَ ٱلْغَفُورُ ٱلرَّحِيمُ",
    "وَٱلَّذِينَ إِذَا فَعَلُوا۟ فَـٰحِشَةً أَوْ ظَلَمُوٓا۟ أَنفُسَهُمْ ذَكَرُوا۟ ٱللَّهَ فَٱسْتَغْفَرُوا۟ لِذُنُوبِهِمْ وَمَن يَغْفِرُ ٱلذُّنُوبَ إِلَّا ٱللَّهُ",
    "يَـٰٓأَيُّهَا ٱلنَّبِىُّ قُل لِّلْمُؤْمِنِينَ يُغُضُّوا۟ مِنْ أَبْصَـٰرِهِمْ وَيَحْفَظُوا۟ فُرُوجَهُمْ ۚ ذَٰلِكَ أَزْكَىٰ لَهُمْ ۚ إِنَّ ٱللَّهَ خَبِيرٌۢ بِمَا يَصْنَعُونَ",
    "وَلَا تَقْرَبُواْ ٱلزِّنَىٰٓ ۖ إِنَّهُۥ كَانَ فَـٰحِشَةًۭ وَسَآءَ سَبِيلًۭا",
    "وَٱلَّذِينَ هُمْ لِفُرُوجِهِمْ حَـٰفِظُونَ",
    "فَمَنِ ٱبْتَغَىٰ وَرَآءَ ذَٰلِكَ فَأُو۟لَـٰٓئِكَ هُمُ ٱلْعَادُونَ",
    "وَٱلَّذِينَ هُمْ لِفُرُوجِهِمْ حَـٰفِظُونَ",
    "وَٱلَّذِينَ هُمْ لِفُرُوجِهِمْ حَـٰفِظُونَ",
];
// وظيفة لحفظ بيانات المستخدمين في الملف
function saveUserData() {
    fs.writeFileSync(userDataFile, JSON.stringify(userData, null, 2));
}

// وظيفة لجدولة التذكير للمستخدم
function scheduleReminder(userId) {
    const user = userData[userId];
    if (!user || !user.isActive) return;

    // حساب التأخير حتى التذكير التالي
    let delay = user.nextReminderTime - Date.now();
    if (delay <= 0) {
        // إذا كان الوقت قد مضى، أرسل التذكير فورًا
        sendReminder(userId);
        return;
    }

    // إلغاء المؤقت السابق إذا كان موجودًا
    if (user.reminderTimer) {
        clearTimeout(user.reminderTimer);
    }

    // جدولة التذكير
    user.reminderTimer = setTimeout(() => {
        sendReminder(userId);
    }, delay);
}

// وظيفة لإرسال التذكير للمستخدم
function sendReminder(userId) {
    const user = userData[userId];
    if (!user || !user.isActive) return;

    const randomAya = ayat[Math.floor(Math.random() * ayat.length)];
    const message = `${user.customMessage}\n\nآية من القرآن الكريم:\n"${randomAya}"`;

    bot.telegram.sendMessage(userId, message, Markup.inlineKeyboard([
        [Markup.button.url('أضرار العادة السرية', 'https://altibbi.com/%D9%85%D8%B5%D8%B7%D9%84%D8%AD%D8%A7%D8%AA-%D8%B7%D8%A8%D9%8A%D8%A9/%D8%A7%D9%84%D8%B5%D8%AD%D8%A9-%D8%A7%D9%84%D8%AC%D9%86%D8%B3%D9%8A%D8%A9/%D8%A7%D9%84%D8%B9%D8%A7%D8%AF%D8%A9-%D8%A7%D9%84%D8%B3%D8%B1%D9%8A%D8%A9')]
    ]))
    .then(() => {
        // إعادة ضبط عدد المحاولات الفاشلة
        user.failedAttempts = 0;

        // تحديث وقت التذكير التالي
        user.nextReminderTime += user.interval;

        // حفظ بيانات المستخدم
        saveUserData();

        // جدولة التذكير التالي
        scheduleReminder(userId);
    })
    .catch(err => {
        console.error(`فشل في إرسال الرسالة إلى المستخدم ${userId}: ${err}`);

        // زيادة عدد المحاولات الفاشلة
        user.failedAttempts = (user.failedAttempts || 0) + 1;

        if (user.failedAttempts >= 3) {
            user.isActive = false;
            saveUserData();
            console.log(`تم إيقاف التذكيرات للمستخدم ${userId} بسبب تكرار المحاولات الفاشلة.`);
        } else {
            // حفظ البيانات وجدولة التذكير التالي
            saveUserData();
            scheduleReminder(userId);
        }
    });
}

// عند بدء البوت، جدول التذكيرات لجميع المستخدمين النشطين
for (const userId in userData) {
    if (userData[userId].isActive) {
        scheduleReminder(userId);
    }
}

// التعامل مع أمر /start
bot.start((ctx) => {
    const userId = ctx.from.id.toString();

    if (!userData[userId]) {
        // تهيئة بيانات المستخدم
        userData[userId] = {
            isActive: false,
            interval: 60 * 60 * 1000, // الفترة الافتراضية: ساعة واحدة
            customMessage: 'تذكر! لا تقم بالعادة السرية!',
            nextReminderTime: 0,
            failedAttempts: 0, // عدد المحاولات الفاشلة
            reminderTimer: null
        };
    }

    const user = userData[userId];

    if (user.isActive) {
        ctx.reply('البوت يعمل بالفعل.');
    } else {
        user.isActive = true;
        user.nextReminderTime = Date.now() + user.interval;

        // حفظ بيانات المستخدم
        saveUserData();

        // جدولة التذكير
        scheduleReminder(userId);

        ctx.reply('تم تشغيل البوت، سيتم تذكيرك كل ساعة.');
    }
});

// التعامل مع أمر /stop لإيقاف التذكيرات
bot.command('stop', (ctx) => {
    const userId = ctx.from.id.toString();

    if (!userData[userId]) {
        ctx.reply('البوت غير مفعل لديك.');
        return;
    }

    const user = userData[userId];

    if (!user.isActive) {
        ctx.reply('البوت متوقف بالفعل.');
    } else {
        user.isActive = false;

        // إلغاء المؤقت إذا كان موجودًا
        if (user.reminderTimer) {
            clearTimeout(user.reminderTimer);
        }

        // حفظ بيانات المستخدم
        saveUserData();

        ctx.reply('تم إيقاف البوت، لن يتم إرسال تذكيرات بعد الآن.');
    }
});

// التعامل مع استقبال الملفات المرسلة
bot.on('document', (ctx) => {
    const fileId = ctx.message.document.file_id;
    const fileSize = ctx.message.document.file_size;
    const maxFileSize = 50 * 1024 * 1024; // 50 ميجا بايت

    if (fileSize > maxFileSize) {
        ctx.reply('الحجم غير مسموح. الحد الأقصى هو 50 ميجا بايت.');
        return;
    }

    // الحصول على رابط التحميل المباشر للملف
    bot.telegram.getFileLink(fileId).then((url) => {
        ctx.reply(`رابط الملف المباشر: ${url}`);
    }).catch((err) => {
        ctx.reply('حدث خطأ أثناء محاولة الحصول على رابط الملف.');
        console.error(err);
    });
});

// التعامل مع استقبال الصور
bot.on('photo', (ctx) => {
    const photo = ctx.message.photo.pop(); // أخذ الصورة الأخيرة (الأكبر حجمًا)
    const fileId = photo.file_id;
    const fileSize = photo.file_size;
    const maxFileSize = 50 * 1024 * 1024; // 50 ميجا بايت

    if (fileSize && fileSize > maxFileSize) {
        ctx.reply('الحجم غير مسموح. الحد الأقصى هو 50 ميجا بايت.');
        return;
    }

    // الحصول على رابط التحميل المباشر للصورة
    bot.telegram.getFileLink(fileId).then((url) => {
        ctx.reply(`رابط الصورة المباشر: ${url}`);
    }).catch((err) => {
        ctx.reply('حدث خطأ أثناء محاولة الحصول على رابط الصورة.');
        console.error(err);
    });
});

// تشغيل البوت
keepAlive();
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));