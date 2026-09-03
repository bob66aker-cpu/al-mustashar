import streamlit as st
import pandas as pd
import numpy as np
import os
import urllib.request
import re
import difflib
import base64
import io
from datetime import datetime, date
from PIL import Image, ImageEnhance

# 1. إعدادات الصفحة الأساسية لتظهر بشكل مثالي على الهواتف
app_icon = "🛡️"
if os.path.exists("shield_logo.png"):
    try:
        app_icon = Image.open("shield_logo.png")
    except Exception:
        pass

st.set_page_config(
    page_title="المستشار الزراعي",
    page_icon=app_icon,
    layout="centered",
    initial_sidebar_state="expanded",
)

# دالة تحويل الصورة وإزالة الخلفية الشطرنجية الرمادية تلقائياً وجعلها شفافة
def get_clean_shield_base64(image_path):
    if os.path.exists(image_path):
        try:
            img = Image.open(image_path).convert("RGBA")
            datas = img.getdata()
            new_data = []
            for item in datas:
                if item[0] > 180 and item[1] > 180 and item[2] > 180:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            img.putdata(new_data)
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            return base64.b64encode(buffered.getvalue()).decode()
        except Exception:
            with open(image_path, "rb") as img_file:
                return base64.b64encode(img_file.read()).decode()
    return ""

shield_b64 = get_clean_shield_base64("shield_logo.png")

# 2. تخصيص المظهر وتنسيق النصوص وحماية الواجهة وإخفاء كافة أيقونات المنصة نهائياً مع ضبط اتجاه RTL الصحيح
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght=300;400;600;700;800&display=swap');
    
    /* 🛡️ إخفاء القوائم والشعارين وأيقونات Streamlit تماماً لتظهر المنصة مستقلة */
    #MainMenu {visibility: hidden !important; display: none !important;}
    footer {visibility: hidden !important; display: none !important;}
    header {visibility: hidden !important; display: none !important;}
    div[data-testid="stToolbar"] {visibility: hidden !important; display: none !important;}
    div[data-testid="stDecoration"] {visibility: hidden !important; display: none !important;}
    div[data-testid="stStatusWidget"] {visibility: hidden !important; display: none !important;}
    #MainMenu, footer, header, .stAppHeader, [data-testid="stHeader"] {display: none !important; opacity: 0 !important;}
    
    .viewerBadge_container__1s523, .viewerBadge_link__1S137, [data-testid="stStatusWidget"], a[href*="streamlit.io"], div[class*="viewerBadge"], div[class*="styles_viewerBadge"], div[data-testid="stAppViewBlockContainer"] + div, #root > div:nth-child(1) > div:nth-child(2) > div, iframe[title="data-testid"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        height: 0 !important;
        width: 0 !important;
    }
    
    html, body, [class*="css"], .stMarkdown, p, h1, h2, h3, h4, span, label, button {
        font-family: 'Cairo', sans-serif !important;
        text-align: right;
        direction: rtl;
    }
    
    .stApp {
        direction: rtl;
        text-align: right;
    }
    
    section[data-testid="stSidebar"] {
        direction: rtl;
        text-align: right;
    }
    
    /* تصميم البطاقات الملونة الصارخة للإرشاد السريع */
    .status-card {
        padding: 22px;
        border-radius: 16px;
        margin: 18px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        text-align: center;
        color: white !important;
    }
    .status-card h2, .status-card p {
        color: white !important;
        text-align: center !important;
    }
    .status-red {
        background: linear-gradient(135deg, #c62828, #8e0000);
        border-right: 8px solid #4a0000;
    }
    .status-green {
        background: linear-gradient(135deg, #2e7d32, #1b5e20);
        border-right: 8px solid #003300;
    }
    .status-yellow {
        background: linear-gradient(135deg, #ef6c00, #b63d00);
        border-right: 8px solid #5d1a00;
    }
    .status-expired {
        background: linear-gradient(135deg, #6a1b9a, #38006b);
        border-right: 8px solid #1a0036;
    }
    
    /* ترويسة التطبيق الرئيسية */
    .app-header {
        background: linear-gradient(135deg, #1e4d2b, #0c2e17);
        padding: 25px 20px;
        border-radius: 16px;
        color: white;
        margin-bottom: 25px;
        box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .header-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 18px;
        width: 100%;
        direction: rtl;
    }
    .header-text {
        text-align: right;
    }
    .header-text h1 {
        color: #ffffff !important;
        font-size: 28px !important;
        font-weight: 800;
        margin: 0 0 4px 0 !important;
        line-height: 1.2;
    }
    .header-text p {
        color: #c8e6c9 !important;
        font-size: 14px !important;
        margin: 0 !important;
        font-weight: 400;
    }
    .shield-img {
        width: 75px;
        height: auto;
        filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));
    }
    .motto-box {
        background-color: rgba(255, 255, 255, 0.12);
        padding: 6px 20px;
        border-radius: 20px;
        margin-top: 15px;
        text-align: center;
    }
    .motto-text {
        font-size: 14px;
        font-weight: 700;
        color: #ffd54f !important;
    }
    .share-btn {
        display: inline-block;
        padding: 8px 14px;
        margin: 4px;
        border-radius: 8px;
        color: white !important;
        text-decoration: none;
        font-size: 13px;
        font-weight: bold;
    }
    .share-wa { background-color: #25D366; }
    .share-fb { background-color: #1877F2; }
    .share-tg { background-color: #0088cc; }
    
    .custom-box {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 15px;
    }
</style>
""", unsafe_allow_html=True)

# 3. دالة تحميل الخط العربي للتقارير
@st.cache_data
def download_arabic_font():
    font_path = "Amiri-Regular.ttf"
    if not os.path.exists(font_path):
        url = "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf"
        try:
            urllib.request.urlretrieve(url, font_path)
        except Exception:
            pass
    return font_path

download_arabic_font()

# 4. دالة تحميل قاعدة البيانات
@st.cache_data
def load_data():
    csv_file = "pesticides_database_for_app.csv"
    if not os.path.exists(csv_file):
        csv_file = "pesticides_database_for_app"
    if not os.path.exists(csv_file):
        all_files = os.listdir('.')
        for f in all_files:
            if "pesticides_database" in f:
                csv_file = f
                break
    if not os.path.exists(csv_file):
        st.error("⚠️ ملف قاعدة البيانات `pesticides_database_for_app.csv` غير موجود!")
        return pd.DataFrame()
    try:
        df = pd.read_csv(csv_file)
        df.columns = df.columns.str.replace('﻿', '').str.strip()
        return df
    except Exception as e:
        st.error(f"⚠️ حدث خطأ أثناء قراءة ملف قاعدة البيانات: {e}")
        return pd.DataFrame()

df_pesticides = load_data()

# 5. الترويسة الموحدة النظيفة (تم إزالة الإيموجي المتداخل لمنع التكرار البصري)
shield_html = f'<img src="data:image/png;base64,{shield_b64}" class="shield-img" />' if shield_b64 else ''
st.markdown(f"""
<div class="app-header">
    <div class="header-content">
        {shield_html}
        <div class="header-text">
            <h1>المستشار الزراعي</h1>
            <p>منظومة تدقيق المبيدات والمواد الفعالة - دولة ليبيا</p>
        </div>
    </div>
    <div class="motto-box">
        <div class="motto-text">« على قدر المعرفة تأتي المسؤولية »</div>
    </div>
</div>
""", unsafe_allow_html=True)

# تنبيه توجيه متصفح الفيسبوك
st.markdown("""
<div class="custom-box" style="border-right: 5px solid #2e7d32;">
    <p style="margin:0; font-size:14px; text-align:justify;">
        📱 <b>نصيحة لتثبيت التطبيق على هاتفك:</b> إذا كنت تفتح الرابط من داخل تطبيق فيسبوك أو واتساب، يُرجى الضغط على النقاط الثلاث بالأعلى ثم اختيار <b>"فتح في المتصفح الخارجي" (Chrome / Safari)</b> لتظهر لك مباشرة خيارات "إضافة إلى الشاشة الرئيسية" ليصبح كأنه تطبيق مثبت على هاتفك.
    </p>
</div>
""", unsafe_allow_html=True)

# 6. بطاقة معلومات التطبيق والمطور والقرارات القانونية
APP_URL = "https://al-mustashar-ly.streamlit.app"
text_to_share = "تطبيق المستشار الزراعي - دليل تدقيق المبيدات والمواد الفعالة المحظورة والمسموحة في ليبيا:"
show_info = st.checkbox("ℹ️ عرض معلومات التطبيق والمطور والقرارات الرسمية وخيارات المشاركة")

if show_info:
    st.markdown('<div class="custom-box">', unsafe_allow_html=True)
    col_img, col_info = st.columns([1, 2])
    with col_img:
        if os.path.exists("developer_photo.jpg"):
            st.image("developer_photo.jpg", use_container_width=True)
        else:
            st.info("🖼️ ضع صورتك باسم developer_photo.jpg بجانب الملف")
    with col_info:
        st.markdown("""
        **👨‍💻 إعداد وتطوير:**  
        المهندس أبوبكر عبدالقادر الطشاني  
        
        **🏛️ الجهة:**  
        وزارة الزراعة والثروة الحيوانية - درنة  
        
        **🌐 المنصة:**  
        مؤسس منصة المستشار الزراعي الليبي  
        """)
    st.markdown("---")
    st.markdown("**📲 شارك التطبيق مع المزارعين والمهندسين:**")
    st.markdown(f"""
    <a class="share-btn share-wa" href="https://api.whatsapp.com/send?text={text_to_share}%20{APP_URL}" target="_blank">📲 واتساب</a>
    <a class="share-btn share-fb" href="https://www.facebook.com/sharer/sharer.php?u={APP_URL}" target="_blank">📘 فيسبوك</a>
    <a class="share-btn share-tg" href="https://t.me/share/url?url={APP_URL}&text={text_to_share}" target="_blank">✈️ تليجرام</a>
    """, unsafe_allow_html=True)
    st.markdown("---")
    st.markdown("""
    **📜 المرجعية القانونية والقرارات:**  
    1. **المواد المحظورة:** قرار وزير الزراعة رقم **(248) لسنة 2024م**.  
    2. **المواد المسجلة والمسموحة:** قرار وزير الزراعة رقم **(500) لسنة 2026م**.  
    
    <small>تطبيق إرشادي مستقل يهدف لخدمة المزارعين والشرطة الزراعية لتسهيل تطبيق القرارات الرسمية للدولة الليبية.</small>
    """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

# 7. وضع الاستخدام
mode = st.radio(
    "اختر وضع الاستخدام المناسب لك:",
    ["🧑‍🌾 وضع المزارع (فحص سريع)", "👮‍♂️ وضع المهندس والرقابة (تفصيلي وقانوني)"],
    index=0,
    horizontal=True
)

st.markdown("---")

def parse_date_from_text(text):
    patterns = [
        r'\b(0[1-9]|1[0-2])[/-](202\d|203\d)\b',
        r'\b(202\d|203\d)[/-](0[1-9]|1[0-2])\b',
        r'\b(0[1-9]|[12]\d|3[01])[/-](0[1-9]|1[0-2])[/-](202\d|203\d)\b',
        r'\b(202\d|203\d)[/-](0[1-9]|1[0-2])[/-](0[1-9]|[12]\d|3[01])\b',
    ]
    found_dates = []
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for m in matches:
            if len(m) == 2:
                if len(m[0]) == 2 and len(m[1]) == 4:
                    month, year = int(m[0]), int(m[1])
                else:
                    year, month = int(m[0]), int(m[1])
                found_dates.append((year, month))
            elif len(m) == 3:
                if len(m[0]) == 4:
                    year, month, day = int(m[0]), int(m[1]), int(m[2])
                else:
                    day, month, year = int(m[0]), int(m[1]), int(m[2])
                found_dates.append((year, month))
    return found_dates

CURRENT_YEAR = 2026
CURRENT_MONTH = 9

# ==================== 🧑‍🌾 وضع المزارع ====================
if "وضع المزارع" in mode:
    st.subheader("🧑‍🌾 بوابة الفحص السريع للمزارع")
    tab_write, tab_camera = st.tabs(["✍️ البحث بالكتابة اليدوية", "📸 الفحص الذكي بالكاميرا والصور"])
    
    found_substance = None
    scanned_expiry_date = None
    manual_expiry_expired = False
    expiry_date_input = None
    
    st.markdown("### 📅 فحص صلاحية المبيد (اختياري)")
    col_exp1, col_exp2 = st.columns(2)
    with col_exp1:
        has_expiry = st.checkbox("أريد فحص تاريخ صلاحية العبوة", value=False)
    with col_exp2:
        if has_expiry:
            expiry_date_input = st.date_input(
                "تاريخ انتهاء الصلاحية على العبوة:",
                value=date(2026, 9, 1),
                min_value=date(2020, 1, 1),
                max_value=date(2035, 12, 31)
            )
            if expiry_date_input < date(2026, 9, 1):
                manual_expiry_expired = True
                
    with tab_write:
        if not df_pesticides.empty:
            substances_list = [""] + sorted(df_pesticides["المادة الفعالة (Active Substance)"].dropna().unique().tolist())
            search_input = st.selectbox(
                "اختر أو اكتب اسم المادة الفعالة بالإنجليزية (Active Ingredient):",
                substances_list,
                index=0,
                key="write_select"
            )
            if search_input:
                found_substance = df_pesticides[df_pesticides["المادة الفعالة (Active Substance)"] == search_input].iloc[0]
        else:
            st.warning("يرجى التأكد من رفع ملف قاعدة البيانات.")
            
    with tab_camera:
        source_type = st.radio(
            "اختر طريقة إدخال الصورة:",
            ["📸 التقاط مباشر بالكاميرا", "🖼️ رفع صورة من الاستوديو / الملفات"],
            horizontal=True,
            key="camera_source_radio"
        )
        
        uploaded_image = None
        if "التقاط مباشر" in source_type:
            st.info("💡 **ملاحظة للهواتف:** سيتم محاولة فتح الكاميرا الخلفية تلقائياً. تأكد من وضوح الإضاءة والتركيز على الملصق.")
            uploaded_image = st.camera_input("وجه الكاميرا نحو ملصق العبوة 📷", key="pesticide_cam")
        else:
            uploaded_image = st.file_uploader("اختر صورة الملصق من الاستوديو أو الملفات:", type=["jpg", "jpeg", "png"], key="pesticide_file")
            
        if uploaded_image:
            st.write("🔄 جاري تحليل النصوص والتواريخ عبر الذكاء الاصطناعي...")
            try:
                import easyocr
                # استخدام اللغة الإنجليزية واللاتينية لأن أسماء المواد الفعالة والتواريخ تكتب بهما دائماً
                # هذا يضمن سرعة هائلة وخفة في ذاكرة السيرفر لعدم تجاوز 1 جيجابايت واحترازاً من الانهيار مفاجئ
                reader = easyocr.Reader(['en'], gpu=False)
                img = Image.open(uploaded_image)
                
                # تحسين تباين الصورة لتحسين دقة القراءة
                enhancer = ImageEnhance.Contrast(img)
                enhanced_img = enhancer.enhance(2.2)
                
                img_np = np.array(enhanced_img)
                results = reader.readtext(img_np)
                
                extracted_text = " ".join([res[1] for res in results]).lower()
                st.success("🤖 تم فحص النصوص والملصق بنجاح!")
                
                dates_found = parse_date_from_text(extracted_text)
                if dates_found:
                    for y, m in dates_found:
                        if y < CURRENT_YEAR or (y == CURRENT_YEAR and m < CURRENT_MONTH):
                            scanned_expiry_date = f"{m:02d}/{y}"
                            break
                        else:
                            scanned_expiry_date = f"{m:02d}/{y}"
                            
                # محرك المطابقة الذكي والبحث المرن (Fuzzy Matching Engine) لتصحيح أخطاء الكاميرا الإملائية تلقائياً
                match_found = False
                best_match_row = None
                best_ratio = 0.0
                
                # تنظيف النص المستخرج وتقسيمه لكلمات لتسهيل المقارنة التقريبية
                text_clean = extracted_text.lower().strip()
                words_in_ocr = re.findall(r'[a-zA-Z]{3,}', text_clean)
                
                for idx, row in df_pesticides.iterrows():
                    sub_name = str(row["المادة الفعالة (Active Substance)"]).strip()
                    sub_clean = sub_name.lower()
                    
                    # 1. مطابقة مباشرة (إذا كتبت المادة بشكل صحيح تماماً في النص)
                    if len(sub_clean) > 3 and sub_clean in text_clean:
                        best_match_row = row
                        best_ratio = 1.0
                        match_found = True
                        break
                        
                    # 2. مطابقة مرنة (تقريبية) لمعالجة أخطاء الكاميرا (مثل قراءة l كـ 1 أو e كـ o)
                    for word in words_in_ocr:
                        ratio = difflib.SequenceMatcher(None, sub_clean, word).ratio()
                        if ratio >= 0.80 and ratio > best_ratio:
                            best_ratio = ratio
                            best_match_row = row
                            match_found = True
                
                if match_found and best_match_row is not None:
                    found_substance = best_match_row
                    sub_name = found_substance["المادة الفعالة (Active Substance)"]
                    if best_ratio == 1.0:
                        st.success(f"🔎 المادة الفعالة المكتشفة: **{sub_name}** (تطابق تام ✅)")
                    else:
                        st.info(f"🔎 المادة الفعالة المكتشفة: **{sub_name}** (تطابق ذكي بنسبة {best_ratio*100:.0f}% 🎯)")
                else:
                    st.warning("⚠️ لم يتم العثور على اسم مادة فعالة مطابقة بالصورة. يرجى تجربة البحث اليدوي.")
                        
                if not match_found:
                    st.warning("⚠️ لم يتم العثور على اسم مادة فعالة مطابقة بالصورة. يرجى تجربة البحث اليدوي.")
            except ImportError:
                st.error("⚠️ نظام OCR غير مفعل على السيرفر، يرجى استخدام البحث اليدوي.")
            except Exception as e:
                st.error(f"حدث خطأ أثناء فحص الصورة: {e}")

    if found_substance is not None:
        sub_name = found_substance["المادة الفعالة (Active Substance)"]
        cas_num = found_substance["رقم CAS"]
        status = found_substance["الحالة"]
        color = found_substance["اللون الإرشادي"]
        details = found_substance["التفصيل والقرار"]
        
        is_expired = False
        expired_date_str = ""
        
        if manual_expiry_expired and expiry_date_input:
            is_expired = True
            expired_date_str = expiry_date_input.strftime('%d/%m/%Y')
        elif scanned_expiry_date:
            m, y = map(int, scanned_expiry_date.split('/'))
            if y < CURRENT_YEAR or (y == CURRENT_YEAR and m < CURRENT_MONTH):
                is_expired = True
                expired_date_str = scanned_expiry_date
                
        if is_expired:
            st.markdown(f"""
            <div class="status-card status-expired">
                <h2>⚠️ خطر: مبيد منتهي الصلاحية وتالف! ❌</h2>
                <p style="font-size: 21px; font-weight: bold; margin: 8px 0;">المادة: {sub_name}</p>
                <p style="font-size: 16px;"><b>تاريخ انتهاء الصلاحية المكتشف: {expired_date_str}</b></p>
                <p style="font-size: 14px; text-align: justify; padding: 0 10px;">
                    استخدام المبيد بعد انتهاء صلاحيته يشكل خطراً كبيراً حيث تتحلل المادة الفعالة إلى مركبات كيميائية سامة قد تسبب حرقاً للمحاصيل، تسمماً للمزارع، وفشلاً تاماً في مكافحة الآفات.
                </p>
            </div>
            """, unsafe_allow_html=True)
        else:
            if str(color).lower() == "red":
                st.markdown(f"""
                <div class="status-card status-red">
                    <h2>🔴 مادة محظورة وممنوعة تماماً! ❌</h2>
                    <p style="font-size: 20px; font-weight: bold; margin: 8px 0;">{sub_name}</p>
                    <p style="font-size: 15px;">ممنوع تركيبها أو استيرادها أو تداولها في ليبيا نهائياً ويُعاقب عليها القانون.</p>
                    <p style="font-size: 13px; opacity: 0.9; margin-top: 12px;">⚠️ السند القانوني: قرار وزير الزراعة رقم 248 لسنة 2024م</p>
                </div>
                """, unsafe_allow_html=True)
            elif str(color).lower() == "green":
                st.markdown(f"""
                <div class="status-card status-green">
                    <h2>🟢 مادة مسموحة ومسجلة ✅</h2>
                    <p style="font-size: 20px; font-weight: bold; margin: 8px 0;">{sub_name}</p>
                    <p style="font-size: 15px;">مسموح تداولها واستخدامها ومطابقة للمعايير المعتمدة الوطنية.</p>
                    <p style="font-size: 13px; opacity: 0.9; margin-top: 12px;">📜 السند القانوني: قرار وزير الزراعة رقم 500 لسنة 2026م</p>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="status-card status-yellow">
                    <h2>⚠️ مادة خاضعة للمراجعة والقيود ⚠️</h2>
                    <p style="font-size: 20px; font-weight: bold; margin: 8px 0;">{sub_name}</p>
                    <p style="font-size: 15px;">{status}</p>
                    <p style="font-size: 13px; opacity: 0.9; margin-top: 10px;"><b>تفصيل القانون:</b> {details}</p>
                </div>
                """, unsafe_allow_html=True)

# ==================== 👮‍♂️ وضع المهندس والمفتش ====================
else:
    st.subheader("👮‍♂️ بوابة الضبط والتفتيش والمهندسين الزراعيين")
    show_guide = st.checkbox("🔍 عرض دليل كشف تلاعب وغش تواريخ الصلاحية (للمفتشين)")
    
    if show_guide:
        st.markdown("""
        <div class="custom-box">
            <h4 style="color: #1e4d2b; margin-top: 0;">🛡️ علامات الغش والتلاعب بالتواريخ:</h4>
            <ol style="margin-bottom: 0; padding-right: 20px; line-height: 1.6;">
                <li><b>اختلاف حبر الطباعة:</b> الحبر المزيف يسهل مسحه أو كشطه باليد أو الكحول أو الأسيتون، بينما الأصلي يطبع ليزرياً بشكل دائم وصعب الإزالة.</li>
                <li><b>آثار الكشط والتنظيف:</b> وجود خدوش دقيقة أو تباين في بهتان البلاستيك والملصق حول منطقة التاريخ.</li>
                <li><b>تطابق رقم التشغيلة (Batch Number):</b> مطابقة الرقم الفاصل للتشغيلة مع الفواتير الأصلية والمستندات الرسمية المعتمدة للمستورد.</li>
                <li><b>التغيرات الفيزيائية للمبيد:</b> انفصال مكونات المبيدات السائلة أو ترسب طبقة صلبة، وتكتل البودرة دليل على التحلل والتلف التام.</li>
            </ol>
        </div>
        """, unsafe_allow_html=True)
        
    if not df_pesticides.empty:
        tab_write_eng, tab_camera_eng = st.tabs(["✍️ البحث واختيار المادة يدوياً", "📸 الفحص الذكي بالكاميرا والصور"])
        
        selected_inspector_sub = ""
        scanned_inspector_sub = None
        
        with tab_write_eng:
            substances_list_eng = [""] + sorted(df_pesticides["المادة الفعالة (Active Substance)"].dropna().unique().tolist())
            selected_inspector_sub = st.selectbox(
                "🔎 اختر أو ابحث عن اسم المادة الفعالة بالإنجليزية (Active Ingredient):",
                substances_list_eng,
                key="inspector_select"
            )
            
        with tab_camera_eng:
            source_type_eng = st.radio(
                "اختر طريقة إدخال الصورة للتفتيش:",
                ["📸 التقاط مباشر بالكاميرا", "🖼️ رفع صورة من الاستوديو / الملفات"],
                horizontal=True,
                key="camera_source_radio_eng"
            )
            
            uploaded_image_eng = None
            if "التقاط مباشر" in source_type_eng:
                st.info("💡 **ملاحظة للمفتشين:** سيتم محاولة فتح الكاميرا الخلفية تلقائياً. تأكد من تركيز الكاميرا على اسم المادة الفعالة.")
                uploaded_image_eng = st.camera_input("وجه الكاميرا نحو ملصق العبوة المراد ضبطها 📷", key="pesticide_cam_eng")
            else:
                uploaded_image_eng = st.file_uploader("اختر صورة الملصق من الاستوديو أو الملفات للتفتيش:", type=["jpg", "jpeg", "png"], key="pesticide_file_eng")
                
            if uploaded_image_eng:
                st.write("🔄 جاري تحليل النصوص ومطابقة المواد الفعالة عبر محرك البحث المرن...")
                try:
                    import easyocr
                    from difflib import SequenceMatcher
                    reader = easyocr.Reader(['en'], gpu=False)
                    img_eng = Image.open(uploaded_image_eng)
                    
                    # تحسين تباين الصورة لتحسين دقة القراءة
                    enhancer_eng = ImageEnhance.Contrast(img_eng)
                    enhanced_img_eng = enhancer_eng.enhance(2.2)
                    
                    img_np_eng = np.array(enhanced_img_eng)
                    results_eng = reader.readtext(img_np_eng)
                    
                    extracted_text_eng = " ".join([res[1] for res in results_eng]).lower()
                    st.success("🤖 تم فحص النصوص والملصق بنجاح!")
                    
                    best_match_sub_eng = None
                    highest_ratio_eng = 0.0
                    
                    # 1. محاولة مطابقة دقيقة أولاً
                    for idx, row in df_pesticides.iterrows():
                        sub_name_db = str(row["المادة الفعالة (Active Substance)"]).strip()
                        if len(sub_name_db) > 3 and sub_name_db.lower() in extracted_text_eng:
                            best_match_sub_eng = row
                            highest_ratio_eng = 1.0
                            break
                    
                    # 2. إذا لم نجد مطابقة دقيقة، نقوم بالبحث المرن (Fuzzy Matching) على الكلمات المقروءة
                    if highest_ratio_eng < 1.0:
                        words_eng = extracted_text_eng.split()
                        for idx, row in df_pesticides.iterrows():
                            sub_name_db = str(row["المادة الفعالة (Active Substance)"]).strip().lower()
                            if len(sub_name_db) > 3:
                                for word in words_eng:
                                    if len(word) > 3:
                                        ratio = SequenceMatcher(None, sub_name_db, word).ratio()
                                        if ratio > highest_ratio_eng:
                                            highest_ratio_eng = ratio
                                            best_match_sub_eng = row
                    
                    # نقبل التطابق إذا كانت النسبة أعلى من 80% (0.80)
                    if best_match_sub_eng is not None and highest_ratio_eng >= 0.80:
                        scanned_inspector_sub = best_match_sub_eng["المادة الفعالة (Active Substance)"]
                        match_percent = int(highest_ratio_eng * 100)
                        st.info(f"🔎 المادة الفعالة المكتشفة تلقائياً: **{scanned_inspector_sub}** (تطابق ذكي بنسبة {match_percent}% 🎯)")
                    else:
                        st.warning("⚠️ لم يتم العثور على اسم مادة فعالة مطابقة بالصورة. يرجى تجربة اختيار المادة يدوياً.")
                except ImportError:
                    st.error("⚠️ نظام OCR غير مفعل على السيرفر، يرجى استخدام البحث اليدوي.")
                except Exception as e:
                    st.error(f"حدث خطأ أثناء فحص الصورة: {e}")
                    
        # تحديد المادة النهائية النشطة للمفتش
        final_inspector_sub = ""
        if selected_inspector_sub:
            final_inspector_sub = selected_inspector_sub
        elif scanned_inspector_sub:
            final_inspector_sub = scanned_inspector_sub
            
        selected_row = None
        if final_inspector_sub:
            selected_row = df_pesticides[df_pesticides["المادة الفعالة (Active Substance)"] == final_inspector_sub].iloc[0]
            
            sub_name = selected_row["المادة الفعالة (Active Substance)"]
            cas_num = selected_row["رقم CAS"]
            status = selected_row["الحالة"]
            color = selected_row["اللون الإرشادي"]
            details = selected_row["التفصيل والقرار"]
            
            if str(color).lower() == "red":
                st.markdown(f"""
                <div class="status-card status-red">
                    <h2>🔴 مادة محظورة وممنوعة قانوناً ❌</h2>
                    <p style="font-size: 21px; font-weight: bold; margin: 5px 0;">المادة: {sub_name}</p>
                    <p style="font-size: 15px;"><b>رقم CAS الدولي:</b> {cas_num}</p>
                    <p style="font-size: 14px; margin-top: 10px;"><b>القرار والسند القانوني:</b> {details}</p>
                </div>
                """, unsafe_allow_html=True)
            elif str(color).lower() == "green":
                st.markdown(f"""
                <div class="status-card status-green">
                    <h2>🟢 مادة مسموحة ومسجلة ✅</h2>
                    <p style="font-size: 21px; font-weight: bold; margin: 5px 0;">المادة: {sub_name}</p>
                    <p style="font-size: 15px;"><b>رقم CAS الدولي:</b> {cas_num}</p>
                    <p style="font-size: 14px; margin-top: 10px;"><b>القرار والسند القانوني:</b> {details}</p>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="status-card status-yellow">
                    <h2>⚠️ مادة خاضعة للقيود ⚠️</h2>
                    <p style="font-size: 21px; font-weight: bold; margin: 5px 0;">المادة: {sub_name}</p>
                    <p style="font-size: 15px;"><b>رقم CAS الدولي:</b> {cas_num}</p>
                    <p style="font-size: 14px; margin-top: 10px;"><b>القرار والسند القانوني:</b> {details}</p>
                </div>
                """, unsafe_allow_html=True)
                
        st.markdown("---")
        st.markdown("### 📝 صياغة محضر ضبط وإثبات حالة مخالفة")
        
        col_form1, col_form2 = st.columns(2)
        with col_form1:
            inspector_name = st.text_input("اسم ضابط الرقابة / المفتش:", "مفتش الشرطة الزراعية")
            authority_name = st.text_input("الجهة الضبطية:", "جهاز الشرطة الزراعية - مكتب درنة")
            offense_type = st.selectbox("نوع المخالفة المرصودة:", ["تداول مادة فعالة محظورة زراعية وقانونياً ❌", "حيازة وتداول مبيد منتهي الصلاحية وتالف ⚠️"])
        with col_form2:
            location_name = st.text_input("مكان وسياق الضبط:", "محلات بيع المواد الزراعية")
            quantity_seized = st.text_input("الكمية المضبوطة:", "5 عبوات")
            default_sub_name = final_inspector_sub if final_inspector_sub else "أدخل اسم المادة"
            selected_substance_manual = st.text_input("اسم المادة الفعالة المضبوطة:", default_sub_name)
            
        if st.button("🖨️ توليد وحفظ تقرير ضبط وإثبات حالة (PDF)"):
            try:
                from fpdf import FPDF
                import arabic_reshaper
                from bidi.algorithm import get_display
                
                pdf = FPDF()
                pdf.add_page()
                
                font_file = "Amiri-Regular.ttf"
                if os.path.exists(font_file):
                    pdf.add_font("Amiri", "", font_file, uni=True)
                    pdf.set_font("Amiri", size=14)
                else:
                    pdf.set_font("Arial", size=14)
                    
                def clean_ar(text):
                    reshaped_text = arabic_reshaper.reshape(text)
                    bidi_text = get_display(reshaped_text)
                    return bidi_text
                    
                title_text = clean_ar("وزارة الزراعة والثروة الحيوانية - دولة ليبيا")
                header_text = clean_ar("تقرير فني رسمي لإثبات حالة ضبط مخالفة مواد زراعية")
                
                pdf.cell(190, 10, txt=title_text, ln=True, align="C")
                pdf.cell(190, 10, txt=header_text, ln=True, align="C")
                pdf.line(10, 30, 200, 30)
                pdf.ln(10)
                
                pdf.cell(190, 10, txt=clean_ar(f"اسم المفتش الرقابي المسؤول: {inspector_name}"), ln=True, align="R")
                pdf.cell(190, 10, txt=clean_ar(f"الجهة الضبطية الرسمية: {authority_name}"), ln=True, align="R")
                pdf.cell(190, 10, txt=clean_ar(f"مكان وسياق الضبط: {location_name}"), ln=True, align="R")
                pdf.cell(190, 10, txt=clean_ar(f"الكمية المضبوطة والمتحفظ عليها: {quantity_seized}"), ln=True, align="R")
                pdf.cell(190, 10, txt=clean_ar(f"نوع المخالفة: {offense_type}"), ln=True, align="R")
                pdf.ln(5)
                pdf.line(10, 85, 200, 85)
                pdf.ln(5)
                
                pdf.cell(190, 10, txt=clean_ar(f"المبيد / المادة الفعالة المضبوطة: {selected_substance_manual}"), ln=True, align="R")
                
                if "محظورة" in offense_type:
                    pdf.cell(190, 10, txt=clean_ar("الحالة القانونية: محظورة وممنوعة تماماً من التداول والتركيب في ليبيا."), ln=True, align="R")
                    pdf.cell(190, 10, txt=clean_ar("السند التشريعي: قرار وزير الزراعة رقم (248) لسنة 2024م."), ln=True, align="R")
                else:
                    pdf.cell(190, 10, txt=clean_ar("الحالة الفنية والقانونية: مبيد منتهي الصلاحية وتالف تمنع التشريعات استخدامه."), ln=True, align="R")
                    pdf.cell(190, 10, txt=clean_ar("الأثر الفني: المادة الفعالة تحللت إلى نواتج سامة تهدد التربة والصحة العامة."), ln=True, align="R")
                    
                pdf.ln(10)
                pdf.cell(190, 10, txt=clean_ar("ملاحظات المفتش الفنية: .................................................................................."), ln=True, align="R")
                pdf.ln(15)
                pdf.cell(90, 10, txt=clean_ar("توقيع المستلم/المخالف: ......................."), ln=False, align="L")
                pdf.cell(90, 10, txt=clean_ar("توقيع الضابط المسؤول: ......................."), ln=True, align="R")
                
                pdf_filename = "seizure_report.pdf"
                pdf.output(pdf_filename)
                
                with open(pdf_filename, "rb") as f:
                    st.download_button(
                        label="📥 اضغط هنا لتنزيل تقرير الضبط (PDF) والطباعة الفورية",
                        data=f,
                        file_name=f"تقرير_ضبط_مخالفة_{selected_substance_manual}.pdf",
                        mime="application/pdf"
                    )
                st.success("✅ تم توليد تقرير الضبط والمطابقة الفنية بنجاح!")
            except Exception as e:
                st.error(f"حدث خطأ أثناء صياغة تقرير الـ PDF: {e}")
    else:
        st.warning("يرجى التأكد من رفع ملف قاعدة البيانات المرفق.")
