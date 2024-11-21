import os
from pytube import YouTube
from tqdm import tqdm

def download_youtube_video(url):
    try:
        # تحليل الفيديو
        yt = YouTube(url)

        # عرض الجودات المتوفرة
        print("الجودات المتوفرة:")
        streams = yt.streams.filter(progressive=True, file_extension="mp4").order_by("resolution").desc()
        for i, stream in enumerate(streams):
            print(f"{i + 1}. {stream.resolution} - {stream.mime_type}")

        # اختيار الجودة
        choice = int(input("اختر رقم الجودة: ")) - 1
        if choice < 0 or choice >= len(streams):
            print("اختيار غير صحيح.")
            return

        selected_stream = streams[choice]

        # إعداد التنزيل
        output_path = os.path.join(os.getcwd(), "downloads")
        os.makedirs(output_path, exist_ok=True)

        print(f"تحميل الفيديو بجودة: {selected_stream.resolution}")
        file_size = selected_stream.filesize
        progress = tqdm(total=file_size, unit='B', unit_scale=True, desc="تحميل")

        def progress_callback(stream, chunk, bytes_remaining):
            progress.update(len(chunk))

        yt.register_on_progress_callback(progress_callback)

        # تحميل الفيديو
        selected_stream.download(output_path)
        progress.close()

        print(f"\nتم التحميل بنجاح! الفيديو محفوظ في: {output_path}")
    except Exception as e:
        print(f"حدث خطأ: {e}")

# إدخال رابط الفيديو
video_url = input("أدخل رابط فيديو اليوتيوب: ")
download_youtube_video(video_url)