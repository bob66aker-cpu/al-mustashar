import streamlit as st
import pandas as pd
import numpy as np
import os
import urllib.request
import re
import difflib
import base64
import io
import json
import hashlib
from datetime import datetime, date, timedelta
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import time

# ===================================================
# 1. إعدادات الصفحة الأساسية
# ===================================================
st.set_page_config(
    page_title="المستشار الزراعي",
    page_icon="🌿",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# ===================================================
# 2. تحميل الخط العربي
# ===================================================
@st.cache_data
def download_arabic_font():
    font_path = "Amiri-Regular.ttf"
    if not os.path.exists(font_path):
        try:
            urllib.request.urlretrieve(
                "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf",
                font_path
            )
        except Exception:
            pass
    return font_path

download_arabic_font()

# ===================================================
# 3. تحميل قاعدة البيانات (ملف Excel الجديد)
# ===================================================
@st.cache_data
def load_data():
    """
    تحميل قاعدة البيانات من ملف Excel الجديد
    يحتوي على:
    - المواد المسجلة (قرار 500 لسنة 2026) - 419 مادة
    - المواد المحظورة (قرار 248 لسنة 2024) - 77 مادة
    """
    excel_file = "libyan_registered_pesticides_2026-v2.xlsx"
    
    # محاولة العثور على الملف
    if not os.path.exists(excel_file):
        # البحث عن الملف في المجلد الحالي
        all_files = os.listdir('.')
        for f in all_files:
            if "pesticides" in f.lower() and (f.endswith('.xlsx') or f.endswith('.xls')):
                excel_file = f
                break
        else:
            st.error("⚠️ ملف قاعدة البيانات غير موجود! يرجى رفع ملف Excel.")
            return None, None
    
    try:
        # قراءة ورقة المواد المسجلة (2026)
        df_registered = pd.read_excel(
            excel_file, 
            sheet_name="قائمة المواد الفعالة (2026)",
            skiprows=2,
            header=0,
            usecols=[0, 1, 2, 3, 4]
        )
        df_registered.columns = ["رقم", "المادة الفعالة", "رقم CAS", "التصنيف", "الحالة"]
        
        # تنظيف البيانات
        df_registered["المادة الفعالة"] = df_registered["المادة الفعالة"].astype(str).str.strip()
        df_registered["رقم CAS"] = df_registered["رقم CAS"].astype(str).str.strip()
        df_registered["التصنيف"] = df_registered["التصنيف"].astype(str).str.strip()
        df_registered["الحالة"] = df_registered["الحالة"].astype(str).str.strip()
        
        # قراءة ورقة المواد المحظورة (2024)
        df_prohibited = pd.read_excel(
            excel_file,
            sheet_name="المواد الفعالة المحظورة (2024)",
            skiprows=2,
            header=0,
            usecols=[0, 1, 2, 3]
        )
        df_prohibited.columns = ["رقم", "الاسم العام", "رقم CAS", "الاستخدام الرئيسي"]
        df_prohibited["الاسم العام"] = df_prohibited["الاسم العام"].astype(str).str.strip()
        df_prohibited["رقم CAS"] = df_prohibited["رقم CAS"].astype(str).str.strip()
        df_prohibited["الاستخدام الرئيسي"] = df_prohibited["الاستخدام الرئيسي"].astype(str).str.strip()
        
        return df_registered, df_prohibited
        
    except Exception as e:
        st.error(f"⚠️ حدث خطأ أثناء قراءة ملف قاعدة البيانات: {e}")
        return None, None

# تحميل البيانات
df_registered, df_prohibited = load_data()

# ===================================================
# 4. دالة التحقق من الانترنت
# ===================================================
def check_internet():
    try:
        import socket
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        return True
    except OSError:
        return False

# ===================================================
# 5. دوال OCR الأساسية (محفوظة كما هي)
# ===================================================
@st.cache_resource
def load_ocr_reader():
    try:
        import easyocr
        return easyocr.Reader(['en'], gpu=False)
    except Exception as e:
        return None

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

def correct_ocr_homoglyphs(text):
    replacements = {
        '1': 'l', '0': 'o', '5': 's', '8': 'b',
        '3': 'e', '4': 'a', '@': 'a',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

def clean_ocr(text):
    corrected = correct_ocr_homoglyphs(text.lower())
    return re.sub(r'[^a-z]', '', corrected)

def find_best_match(df_registered, df_prohibited, extracted_text):
    """
    محرك المطابقة المرنة المتطور - V15
    يبحث في كل من المواد المسجلة والمحظورة
    """
    if df_registered is None or df_registered.empty:
        return None, 0.0, None, None, False
        
    text_clean = extracted_text.lower().strip()
    text_squashed = clean_ocr(text_clean)
    
    best_match_row = None
    best_ratio = 0.0
    match_found = False
    is_prohibited = False
    
    # البحث في المواد المسجلة
    for idx, row in df_registered.iterrows():
        sub_name = str(row["المادة الفعالة"]).strip()
        sub_clean = sub_name.lower()
        sub_squashed = clean_ocr(sub_clean)
        
        # تطابق تام
        if len(sub_clean) > 3 and (sub_clean in text_clean or sub_squashed in text_squashed):
            # التحقق من كونها محظورة
            prohibited = check_if_prohibited(df_prohibited, sub_name)
            return row, 1.0, prohibited, "Approved", True
            
        # مطابقة مرنة
        l = len(sub_squashed)
        if l <= 4:
            thresh = 0.90
        elif l <= 6:
            thresh = 0.80
        else:
            thresh = 0.70
            
        words_in_ocr = re.findall(r'[a-zA-Z]{3,}', text_clean)
        for word in words_in_ocr:
            word_clean = clean_ocr(word)
            ratio = difflib.SequenceMatcher(None, sub_squashed, word_clean).ratio()
            if ratio >= thresh and ratio > best_ratio:
                best_ratio = ratio
                best_match_row = row
                match_found = True
                
        # النوافذ المنزلقة للنصوص الطويلة
        if l >= 5 and len(text_squashed) >= l:
            win_sizes = [l - 1, l, l + 1, l + 2]
            for w_len in win_sizes:
                for i in range(len(text_squashed) - w_len + 1):
                    sub_str = text_squashed[i:i+w_len]
                    if len(sub_str) >= 4:
                        ratio = difflib.SequenceMatcher(None, sub_squashed, sub_str).ratio()
                        if ratio >= thresh and ratio > best_ratio:
                            best_ratio = ratio
                            best_match_row = row
                            match_found = True
                            
    if best_match_row is not None:
        sub_name = str(best_match_row["المادة الفعالة"]).strip()
        is_prohibited = check_if_prohibited(df_prohibited, sub_name)
        status = str(best_match_row.get("الحالة", "Approved")).strip()
        return best_match_row, best_ratio, is_prohibited, status, match_found
        
    return None, 0.0, None, None, False

def check_if_prohibited(df_prohibited, substance_name):
    """التحقق من وجود المادة في قائمة المواد المحظورة"""
    if df_prohibited is None or df_prohibited.empty:
        return False
    
    substance_clean = substance_name.lower().strip()
    for idx, row in df_prohibited.iterrows():
        prohibited_name = str(row["الاسم العام"]).lower().strip()
        # التحقق من تطابق جزئي
        if substance_clean in prohibited_name or prohibited_name in substance_clean:
            return True
        # التحقق من تطابق قريب
        ratio = difflib.SequenceMatcher(None, substance_clean, prohibited_name).ratio()
        if ratio >= 0.8:
            return True
    return False

CURRENT_YEAR = 2026
CURRENT_MONTH = 9

# ===================================================
# 6. دالة تحليل المخاطر البيئية والصحية (البرومبت الثالث)
# ===================================================
def analyze_health_environmental_risks(substance_name, cas_number, status, is_prohibited=False):
    """
    تحليل المخاطر البيئية والصحية للمادة الفعالة
    مع إضافة اللوائح الدولية (EU + USA)
    """
    risk_database = {
        "glyphosate": {
            "toxicity": "متوسط",
            "env_impact": "تأثير محتمل على الكائنات المائية والنحل",
            "health_risks": "قد يسبب تهيجاً للجلد والعينين، مشتبه في كونه مسرطناً",
            "safety": "ارتداء قفازات ونظارات واقية، تجنب الرش في أيام الرياح",
            "eu_status": "مصرح به حتى 2022، قيد المراجعة",
            "usa_status": "مسموح، قيد المراجعة القضائية"
        },
        "chlorpyrifos": {
            "toxicity": "مرتفع",
            "env_impact": "سام جداً للأسماك والطيور والحشرات النافعة",
            "health_risks": "مثبط للكولينستيراز، يؤثر على الجهاز العصبي",
            "safety": "ممنوع الاستخدام بالقرب من المسطحات المائية، ارتداء بدلة واقية كاملة",
            "eu_status": "محظور في الاتحاد الأوروبي",
            "usa_status": "محظور للاستخدام في المحاصيل الغذائية"
        },
        "paraquat": {
            "toxicity": "مرتفع جداً",
            "env_impact": "سام للبيئة، يبقى في التربة لفترات طويلة",
            "health_risks": "قاتل عند البلع، يسبب تليف رئوي حاد",
            "safety": "ممنوع التداول تماماً، يتطلب تدخل طبي فوري عند التعرض",
            "eu_status": "محظور في الاتحاد الأوروبي",
            "usa_status": "مسموح بتصاريح خاصة، قيد المراجعة"
        },
        "atrazine": {
            "toxicity": "متوسط",
            "env_impact": "ملوث للمياه الجوفية، يؤثر على النظام الهرموني للكائنات المائية",
            "health_risks": "مشتبه في كونه مخلّاً بالغدد الصماء",
            "safety": "تجنب الاستخدام في المناطق ذات منسوب المياه الجوفية المرتفع",
            "eu_status": "محظور في الاتحاد الأوروبي",
            "usa_status": "مسموح بشروط، قيد المراجعة"
        },
        "mancozeb": {
            "toxicity": "منخفض",
            "env_impact": "يتحلل بسرعة في البيئة، منخفض السمية للثدييات",
            "health_risks": "قد يسبب حساسية جلدية لدى بعض الأشخاص",
            "safety": "ارتداء قفازات عند المناولة، غسل اليدين جيداً بعد الاستخدام",
            "eu_status": "قيد المراجعة، استخدام محدود",
            "usa_status": "مسموح"
        },
        "abamectin": {
            "toxicity": "متوسط",
            "env_impact": "سام للحشرات النافعة والكائنات المائية",
            "health_risks": "قد يسبب تهيجاً للجلد والعينين",
            "safety": "ارتداء معدات الوقاية الشخصية، تجنب الرش عند وجود نحل",
            "eu_status": "مسموح بشروط",
            "usa_status": "مسموح"
        },
        "lambda-cyhalothrin": {
            "toxicity": "مرتفع",
            "env_impact": "سام جداً للنحل والكائنات المائية",
            "health_risks": "مهيج للجلد والعينين، مؤثر على الجهاز العصبي",
            "safety": "تجنب الرش أثناء تفتح الأزهار، ارتداء معدات الوقاية",
            "eu_status": "قيد المراجعة",
            "usa_status": "مسموح بشروط"
        }
    }
    
    # البحث في قاعدة بيانات المخاطر
    substance_key = substance_name.lower().strip()
    risk_data = None
    
    for key, value in risk_database.items():
        if key in substance_key or substance_key in key:
            risk_data = value
            break
    
    # إذا كانت المادة محظورة
    if is_prohibited:
        return {
            "toxicity": "مرتفع جداً",
            "env_impact": "تأثير بيئي خطير، ممنوع التداول",
            "health_risks": "مخاطر صحية جسيمة، ممنوع الاستخدام",
            "safety": "ممنوع التداول والاستخدام تماماً",
            "eu_status": "محظور في الاتحاد الأوروبي (يُرجى التحقق من القائمة الرسمية)",
            "usa_status": "محظور أو مقيد في الولايات المتحدة (يُرجى التحقق من وكالة حماية البيئة)",
            "source": "قرار وزير الزراعة رقم 248 لسنة 2024"
        }
    
    # إذا كانت المادة غير موجودة في قاعدة المخاطر
    if risk_data is None:
        return {
            "toxicity": "غير محدد",
            "env_impact": "غير محدد، يرجى الرجوع إلى النشرة الفنية للمنتج",
            "health_risks": "غير محدد، يرجى الرجوع إلى النشرة الفنية للمنتج",
            "safety": "اتبع تعليمات السلامة على العبوة",
            "eu_status": "غير محدد، يرجى التحقق من قاعدة بيانات الاتحاد الأوروبي",
            "usa_status": "غير محدد، يرجى التحقق من قاعدة بيانات وكالة حماية البيئة الأمريكية",
            "source": "بيانات أولية - يرجى التحقق من المصادر الرسمية"
        }
    
    # إضافة الحالة التنظيمية
    return {
        **risk_data,
        "source": "قاعدة بيانات المخاطر (محدثة 2026)"
    }

# ===================================================
# 7. دوال معالجة الصور (ميزة المعرض)
# ===================================================
def preprocess_image_for_ocr(image):
    """معالجة الصورة قبل OCR"""
    try:
        if image.mode != 'L':
            image = image.convert('L')
        
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.5)
        
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.2)
        
        return image
    except Exception:
        return image

# ===================================================
# 8. دوال إدارة التاريخ والسجل
# ===================================================
@st.cache_data
def get_history():
    history_file = "scan_history.json"
    if os.path.exists(history_file):
        try:
            with open(history_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def save_history(entry):
    history_file = "scan_history.json"
    history = get_history()
    history.insert(0, entry)
    if len(history) > 100:
        history = history[:100]
    try:
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except:
        pass

def clear_history():
    history_file = "scan_history.json"
    if os.path.exists(history_file):
        try:
            os.remove(history_file)
        except:
            pass

# ===================================================
# 9. دوال المشاركة الاحترافية
# ===================================================
def get_share_text(substance_name=None, status=None, cas=None, confidence=None, risk=None):
    base_text = "🌿 المستشار الزراعي | AGRICULTURAL ADVISOR\n"
    base_text += "دليل تدقيق المبيدات والمواد الفعالة - دولة ليبيا\n\n"
    if substance_name:
        base_text += f"🔬 المادة الفعالة: {substance_name}\n"
    if cas:
        base_text += f"📋 رقم CAS: {cas}\n"
    if status:
        status_labels = {
            "Approved": "✅ مسموح",
            "REV": "📝 قيد المراجعة العلمية",
            "REV*": "📝 قيد المراجعة العلمية",
            "RAR": "⚠️ تقييم مخاطر مطلوب",
            "Prohibited": "🔴 محظور"
        }
        base_text += f"📌 الحالة: {status_labels.get(status, status)}\n"
    if confidence is not None:
        base_text += f"🎯 درجة التطابق: {confidence}%\n"
    if risk:
        base_text += f"\n⚠️ المخاطر الصحية: {risk}\n"
    base_text += "\n📱 تحميل التطبيق: https://al-mustashar-ly.streamlit.app"
    return base_text

def get_share_url():
    return "https://al-mustashar-ly.streamlit.app"

def generate_share_html(text, url):
    encoded_text = text.replace(" ", "%20").replace("\n", "%0A")
    encoded_url = url.replace("/", "%2F").replace(":", "%3A")
    
    return f"""
    <div class="share-buttons">
        <a class="share-btn whatsapp" href="https://api.whatsapp.com/send?text={encoded_text}%0A{encoded_url}" target="_blank">📲 واتساب</a>
        <a class="share-btn telegram" href="https://t.me/share/url?url={encoded_url}&text={encoded_text}" target="_blank">✈️ تليجرام</a>
        <a class="share-btn facebook" href="https://www.facebook.com/sharer/sharer.php?u={encoded_url}" target="_blank">📘 فيسبوك</a>
        <a class="share-btn messenger" href="fb-messenger://share?link={encoded_url}" target="_blank">💬 ماسنجر</a>
        <a class="share-btn email" href="mailto:?subject=المستشار%20الزراعي&body={encoded_text}%0A{encoded_url}" target="_blank">✉️ بريد</a>
        <button class="share-btn system" onclick="if(navigator.share){{navigator.share({{title:'المستشار الزراعي',text:'{text}',url:'{url}'}})}}">📤 مشاركة</button>
    </div>
    """

# ===================================================
# 10. تصميم CSS المتقدم
# ===================================================
def inject_css():
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap');
    
    #MainMenu, footer, header, div[data-testid="stToolbar"], 
    div[data-testid="stDecoration"], div[data-testid="stStatusWidget"] {
        visibility: hidden !important;
        display: none !important;
    }
    .stAppHeader {display: none !important;}
    
    html, body, .stApp, .stMarkdown, p, h1, h2, h3, h4, span, label, button, div {
        font-family: 'Cairo', sans-serif !important;
        text-align: right;
        direction: rtl;
    }
    
    .stApp {
        background: #f5f0eb;
        direction: rtl;
    }
    
    .main-container {
        max-width: 480px;
        margin: 0 auto;
        padding: 12px 10px 100px 10px;
        direction: rtl;
    }
    
    .app-header-glass {
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 24px;
        padding: 14px 18px;
        margin-bottom: 18px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 8px 32px rgba(0, 20, 10, 0.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .app-header-glass .title-section h1 {
        font-size: 20px;
        font-weight: 800;
        color: #1a3a2a;
        margin: 0;
        line-height: 1.2;
    }
    
    .app-header-glass .title-section .subtitle {
        font-size: 10px;
        color: #6b7a6b;
        font-weight: 400;
    }
    
    .app-header-glass .status-badge {
        background: rgba(46, 125, 50, 0.12);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 9px;
        color: #2e7d32;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 5px;
        border: 1px solid rgba(46, 125, 50, 0.15);
    }
    
    .app-header-glass .status-badge .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #2e7d32;
        display: inline-block;
        animation: pulse-dot 2s infinite;
    }
    
    @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
    
    .bento-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
    }
    
    .bento-grid .full-width {
        grid-column: 1 / -1;
    }
    
    .bento-card {
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 18px;
        padding: 18px 16px;
        border: 1px solid rgba(255, 255, 255, 0.5);
        box-shadow: 0 4px 20px rgba(0, 20, 10, 0.04);
        transition: all 0.25s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }
    
    .bento-card:active {
        transform: scale(0.97);
    }
    
    .bento-card .card-icon {
        font-size: 26px;
        margin-bottom: 8px;
        display: block;
    }
    
    .bento-card .card-title {
        font-size: 15px;
        font-weight: 700;
        color: #1a3a2a;
        margin: 0 0 3px 0;
        line-height: 1.3;
    }
    
    .bento-card .card-desc {
        font-size: 11px;
        color: #6b7a6b;
        margin: 0;
        line-height: 1.4;
        font-weight: 400;
    }
    
    .bento-card.primary {
        background: linear-gradient(145deg, #1a4a2a, #0d2e1a);
        border: none;
    }
    
    .bento-card.primary .card-title {
        color: #ffffff;
    }
    
    .bento-card.primary .card-desc {
        color: rgba(255, 255, 255, 0.75);
    }
    
    .bento-card.primary .card-icon {
        filter: brightness(0) invert(1);
    }
    
    .bento-card.glass-green {
        background: rgba(46, 125, 50, 0.08);
        border: 1px solid rgba(46, 125, 50, 0.12);
    }
    
    .bento-card.glass-red {
        background: rgba(198, 40, 40, 0.08);
        border: 1px solid rgba(198, 40, 40, 0.12);
    }
    
    .result-card {
        background: rgba(255, 255, 255, 0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 20px;
        padding: 20px 18px;
        border: 1px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 8px 32px rgba(0, 20, 10, 0.06);
        margin-bottom: 14px;
        animation: slideUp 0.5s ease;
    }
    
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .result-card .result-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .result-card .result-header .substance-name {
        font-size: 18px;
        font-weight: 800;
        color: #1a3a2a;
    }
    
    .result-card .result-header .status-tag {
        font-size: 11px;
        padding: 4px 14px;
        border-radius: 20px;
        font-weight: 600;
        white-space: nowrap;
    }
    
    .status-tag.prohibited {
        background: rgba(198, 40, 40, 0.15);
        color: #c62828;
    }
    
    .status-tag.approved {
        background: rgba(46, 125, 50, 0.15);
        color: #2e7d32;
    }
    
    .status-tag.rev {
        background: rgba(239, 108, 0, 0.15);
        color: #ef6c00;
    }
    
    .status-tag.rar {
        background: rgba(25, 118, 210, 0.15);
        color: #1565c0;
    }
    
    .result-card .result-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .result-card .result-details .detail-item .label {
        font-size: 9px;
        color: #8a9a8a;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    
    .result-card .result-details .detail-item .value {
        font-size: 13px;
        font-weight: 600;
        color: #1a3a2a;
        margin-top: 2px;
    }
    
    .result-card .confidence-bar {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .result-card .confidence-bar .conf-label {
        font-size: 10px;
        color: #8a9a8a;
        display: flex;
        justify-content: space-between;
    }
    
    .result-card .confidence-bar .track {
        height: 4px;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 4px;
        margin-top: 4px;
        overflow: hidden;
    }
    
    .result-card .confidence-bar .track .fill {
        height: 100%;
        border-radius: 4px;
        background: linear-gradient(90deg, #2e7d32, #43a047);
        transition: width 0.8s ease;
    }
    
    .regulation-card {
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 14px 16px;
        margin-top: 10px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-right: 4px solid #1a4a2a;
    }
    
    .regulation-card .reg-title {
        font-size: 13px;
        font-weight: 700;
        color: #1a3a2a;
        margin-bottom: 6px;
    }
    
    .regulation-card .reg-item {
        font-size: 12px;
        color: #3a5a3a;
        padding: 4px 0;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .regulation-card .reg-item .reg-icon {
        font-size: 16px;
    }
    
    .bottom-nav {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 28px);
        max-width: 480px;
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border-radius: 24px;
        padding: 6px 10px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.5);
        box-shadow: 0 8px 40px rgba(0, 20, 10, 0.08);
        z-index: 1000;
        direction: rtl;
    }
    
    .bottom-nav .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
        padding: 6px 10px;
        border-radius: 14px;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Cairo', sans-serif;
        min-width: 44px;
    }
    
    .bottom-nav .nav-item .nav-icon {
        font-size: 20px;
        line-height: 1;
    }
    
    .bottom-nav .nav-item .nav-label {
        font-size: 9px;
        color: #6b7a6b;
        font-weight: 500;
        transition: color 0.2s;
    }
    
    .bottom-nav .nav-item.active .nav-label {
        color: #1a4a2a;
        font-weight: 700;
    }
    
    .bottom-nav .nav-item.active {
        background: rgba(26, 74, 42, 0.08);
    }
    
    .bottom-nav .nav-item:active {
        transform: scale(0.92);
    }
    
    .share-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin: 10px 0;
    }
    
    .share-buttons .share-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        font-family: 'Cairo', sans-serif;
        flex: 1;
        justify-content: center;
        min-width: 60px;
    }
    
    .share-buttons .share-btn:active {
        transform: scale(0.95);
    }
    
    .share-buttons .share-btn.whatsapp { background: #25D366; }
    .share-buttons .share-btn.telegram { background: #0088cc; }
    .share-buttons .share-btn.facebook { background: #1877F2; }
    .share-buttons .share-btn.messenger { background: #00B2FF; }
    .share-buttons .share-btn.email { background: #6b7a6b; }
    .share-buttons .share-btn.system { background: #1a3a2a; }
    
    .dark-mode .stApp {
        background: #121a14;
    }
    
    .dark-mode .app-header-glass {
        background: rgba(26, 40, 30, 0.85);
        border-color: rgba(255, 255, 255, 0.06);
    }
    
    .dark-mode .app-header-glass .title-section h1 {
        color: #e8f0e8;
    }
    
    .dark-mode .bento-card {
        background: rgba(30, 50, 40, 0.75);
        border-color: rgba(255, 255, 255, 0.04);
    }
    
    .dark-mode .bento-card .card-title {
        color: #e8f0e8;
    }
    
    .dark-mode .bento-card .card-desc {
        color: #8a9a8a;
    }
    
    .dark-mode .bento-card.primary {
        background: linear-gradient(145deg, #0d2e1a, #061a0e);
    }
    
    .dark-mode .result-card {
        background: rgba(30, 50, 40, 0.8);
        border-color: rgba(255, 255, 255, 0.04);
    }
    
    .dark-mode .result-card .result-header .substance-name {
        color: #e8f0e8;
    }
    
    .dark-mode .bottom-nav {
        background: rgba(20, 35, 25, 0.85);
        border-color: rgba(255, 255, 255, 0.04);
    }
    
    .dark-mode .regulation-card {
        background: rgba(30, 50, 40, 0.7);
        border-color: rgba(255, 255, 255, 0.04);
    }
    
    @media (max-width: 400px) {
        .bento-grid { gap: 10px; }
        .bento-card { padding: 14px 12px; }
        .bento-card .card-title { font-size: 13px; }
        .result-card .result-header .substance-name { font-size: 16px; }
        .app-header-glass .title-section h1 { font-size: 17px; }
        .bottom-nav .nav-item { padding: 4px 8px; min-width: 36px; }
        .bottom-nav .nav-item .nav-icon { font-size: 17px; }
        .bottom-nav .nav-item .nav-label { font-size: 8px; }
    }
    </style>
    """, unsafe_allow_html=True)

# ===================================================
# 11. الواجهة الرئيسية
# ===================================================
def main():
    inject_css()
    is_online = check_internet()
    
    st.markdown(f"""
    <div class="app-header-glass">
        <div class="title-section">
            <h1>🌿 المستشار الزراعي</h1>
            <div class="subtitle">منظومة تدقيق المبيدات - ليبيا</div>
        </div>
        <div class="status-badge">
            <span class="dot"></span>
            {"متصل" if is_online else "غير متصل (البيانات المحلية متوفرة)"}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    dark_mode = st.checkbox("🌙 الوضع المظلم", value=False)
    if dark_mode:
        st.markdown('<div class="dark-mode">', unsafe_allow_html=True)
    
    tab = st.radio(
        "القائمة",
        ["🏠 الرئيسية", "🔍 البحث", "📸 الفحص", "📋 السجل", "⚙️ الإعدادات"],
        horizontal=True,
        label_visibility="collapsed"
    )
    
    if tab == "🏠 الرئيسية":
        show_home()
    elif tab == "🔍 البحث":
        show_search()
    elif tab == "📸 الفحص":
        show_scan()
    elif tab == "📋 السجل":
        show_history()
    elif tab == "⚙️ الإعدادات":
        show_settings()
    
    st.markdown("""
    <div class="bottom-nav">
        <button class="nav-item active" onclick="window.location.href='#'">
            <span class="nav-icon">🏠</span>
            <span class="nav-label">الرئيسية</span>
        </button>
        <button class="nav-item" onclick="window.location.href='#بحث'">
            <span class="nav-icon">🔍</span>
            <span class="nav-label">البحث</span>
        </button>
        <button class="nav-item" onclick="window.location.href='#فحص'">
            <span class="nav-icon">📸</span>
            <span class="nav-label">الفحص</span>
        </button>
        <button class="nav-item" onclick="window.location.href='#سجل'">
            <span class="nav-icon">📋</span>
            <span class="nav-label">السجل</span>
        </button>
        <button class="nav-item" onclick="window.location.href='#إعدادات'">
            <span class="nav-icon">⚙️</span>
            <span class="nav-label">الإعدادات</span>
        </button>
    </div>
    """, unsafe_allow_html=True)
    
    if dark_mode:
        st.markdown('</div>', unsafe_allow_html=True)

# ===================================================
# 12. شاشة الرئيسية
# ===================================================
def show_home():
    if df_registered is not None and not df_registered.empty:
        total = len(df_registered)
        approved = len(df_registered[df_registered["الحالة"] == "Approved"])
        prohibited_count = len(df_prohibited) if df_prohibited is not None else 0
        
        st.markdown(f"""
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px;">
            <div style="background: rgba(255,255,255,0.7); padding: 12px; border-radius: 14px; text-align: center;">
                <div style="font-size: 22px; font-weight: 800; color: #1a3a2a;">{total}</div>
                <div style="font-size: 10px; color: #6b7a6b;">إجمالي المواد</div>
            </div>
            <div style="background: rgba(46,125,50,0.1); padding: 12px; border-radius: 14px; text-align: center;">
                <div style="font-size: 22px; font-weight: 800; color: #2e7d32;">{approved}</div>
                <div style="font-size: 10px; color: #6b7a6b;">مسموحة</div>
            </div>
            <div style="background: rgba(198,40,40,0.1); padding: 12px; border-radius: 14px; text-align: center;">
                <div style="font-size: 22px; font-weight: 800; color: #c62828;">{prohibited_count}</div>
                <div style="font-size: 10px; color: #6b7a6b;">محظورة</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="bento-grid">
        <div class="bento-card primary full-width" onclick="document.querySelector('[data-testid=\"stRadio\"] [value=\\\"📸 الفحص\\\"]')?.click()">
            <span class="card-icon">🔬</span>
            <div class="card-title">افحص الآن</div>
            <div class="card-desc">صوّر اسم المبيد أو المادة الفعالة</div>
        </div>
        <div class="bento-card glass-green" onclick="document.querySelector('[data-testid=\"stRadio\"] [value=\\\"📸 الفحص\\\"]')?.click()">
            <span class="card-icon">📷</span>
            <div class="card-title">كاميرا</div>
            <div class="card-desc">التقاط مباشر</div>
        </div>
        <div class="bento-card" onclick="document.querySelector('[data-testid=\"stRadio\"] [value=\\\"📸 الفحص\\\"]')?.click()">
            <span class="card-icon">🖼️</span>
            <div class="card-title">معرض الصور</div>
            <div class="card-desc">اختر صورة من الهاتف</div>
        </div>
        <div class="bento-card" onclick="document.querySelector('[data-testid=\"stRadio\"] [value=\\\"🔍 البحث\\\"]')?.click()">
            <span class="card-icon">✍️</span>
            <div class="card-title">بحث يدوي</div>
            <div class="card-desc">اكتب اسم المادة الفعالة</div>
        </div>
        <div class="bento-card glass-amber">
            <span class="card-icon">📊</span>
            <div class="card-title">الإحصائيات</div>
            <div class="card-desc">عرض إحصائيات قاعدة البيانات</div>
        </div>
        <div class="bento-card" onclick="document.querySelector('[data-testid=\"stRadio\"] [value=\\\"📋 السجل\\\"]')?.click()">
            <span class="card-icon">📋</span>
            <div class="card-title">السجل</div>
            <div class="card-desc">سجل الفحوصات السابقة</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    mode = st.radio(
        "اختر وضع الاستخدام:",
        ["🧑‍🌾 المزارع (فحص سريع)", "👨‍💻 للمحترفين (تفصيلي)"],
        horizontal=True,
        key="mode_select"
    )
    
    st.markdown("---")
    
    with st.expander("ℹ️ عن التطبيق والمطور"):
        st.markdown("""
        **👨‍💻 إعداد وتطوير:**  
        المهندس أبوبكر عبدالقادر الطشاني  
        
        **🏛️ الجهة:**  
        وزارة الزراعة والثروة الحيوانية - درنة  
        
        **📜 المرجعية القانونية:**  
        - **المواد المسجلة:** قرار وزير الزراعة رقم (500) لسنة 2026م  
        - **المواد المحظورة:** قرار وزير الزراعة رقم (248) لسنة 2024م  
        
        **🌍 اللوائح الدولية المرجعية:**  
        - قاعدة بيانات المبيدات - الاتحاد الأوروبي (EU Pesticides Database)  
        - قاعدة بيانات المواد الكيميائية - وكالة حماية البيئة الأمريكية (EPA)  
        
        <small>تطبيق إرشادي مستقل يهدف لخدمة القطاع الزراعي في ليبيا.</small>
        """, unsafe_allow_html=True)

# ===================================================
# 13. شاشة البحث
# ===================================================
def show_search():
    st.subheader("🔍 البحث عن مادة فعالة")
    
    if df_registered is None or df_registered.empty:
        st.warning("⚠️ قاعدة البيانات غير متوفرة")
        return
    
    search_term = st.text_input("ابحث باسم المادة الفعالة (بالإنجليزية أو العربية):", placeholder="مثال: Glyphosate")
    
    if search_term:
        search_lower = search_term.lower().strip()
        results = []
        
        for idx, row in df_registered.iterrows():
            sub_name = str(row["المادة الفعالة"]).lower()
            if search_lower in sub_name or sub_name in search_lower:
                results.append(row)
            else:
                ratio = difflib.SequenceMatcher(None, search_lower, sub_name).ratio()
                if ratio >= 0.6:
                    results.append(row)
        
        if results:
            st.success(f"✅ تم العثور على {len(results)} نتيجة")
            for row in results[:10]:
                display_result_row(row)
        else:
            st.warning("❌ لم يتم العثور على نتائج")

# ===================================================
# 14. شاشة الفحص
# ===================================================
def show_scan():
    st.subheader("📸 فحص المبيدات")
    
    source = st.radio(
        "اختر مصدر الصورة:",
        ["📸 كاميرا", "🖼️ معرض الصور"],
        horizontal=True
    )
    
    uploaded_image = None
    
    if source == "📸 كاميرا":
        uploaded_image = st.camera_input("وجه الكاميرا نحو ملصق العبوة")
    else:
        uploaded_image = st.file_uploader(
            "اختر صورة من معرض هاتفك",
            type=["jpg", "jpeg", "png"],
            help="يمكنك اختيار صورة موجودة مسبقاً على هاتفك"
        )
    
    if uploaded_image:
        with st.spinner("🔄 جاري تحليل الصورة..."):
            process_scanned_image(uploaded_image)

def process_scanned_image(uploaded_image):
    try:
        reader = load_ocr_reader()
        if reader is None:
            st.error("⚠️ نظام OCR غير متوفر. يرجى الاتصال بالإنترنت لتحميل النماذج.")
            return
        
        img = Image.open(uploaded_image)
        processed_img = preprocess_image_for_ocr(img)
        img_np = np.array(processed_img)
        
        results = reader.readtext(img_np)
        extracted_text = " ".join([res[1] for res in results]).lower()
        
        st.info(f"📝 النص المستخرج: {extracted_text[:100]}...")
        
        dates = parse_date_from_text(extracted_text)
        if dates:
            st.success(f"📅 تم العثور على تواريخ: {dates}")
        
        best_match, confidence, is_prohibited, status, found = find_best_match(
            df_registered, df_prohibited, extracted_text
        )
        
        if found and best_match is not None:
            st.success(f"✅ تم العثور على تطابق بنسبة {confidence*100:.0f}%")
            
            display_result_card(best_match, confidence, is_prohibited, status, extracted_text)
            
            save_history({
                "timestamp": datetime.now().isoformat(),
                "substance": str(best_match["المادة الفعالة"]),
                "cas": str(best_match["رقم CAS"]),
                "status": status,
                "confidence": confidence,
                "prohibited": is_prohibited,
                "source": "scan"
            })
            
            st.markdown("### 📤 مشاركة النتيجة")
            share_text = get_share_text(
                str(best_match["المادة الفعالة"]),
                status,
                str(best_match["رقم CAS"]),
                int(confidence * 100)
            )
            st.markdown(generate_share_html(share_text, get_share_url()), unsafe_allow_html=True)
            
        else:
            st.warning("⚠️ لم يتم العثور على تطابق في قاعدة البيانات")
            
    except Exception as e:
        st.error(f"❌ حدث خطأ أثناء معالجة الصورة: {e}")

# ===================================================
# 15. عرض النتائج
# ===================================================
def display_result_row(row):
    sub_name = str(row["المادة الفعالة"])
    cas = str(row["رقم CAS"])
    status = str(row["الحالة"])
    category = str(row["التصنيف"])
    
    is_prohibited = check_if_prohibited(df_prohibited, sub_name)
    
    status_labels = {
        "Approved": ("✅ مسموح", "approved"),
        "REV": ("📝 قيد المراجعة", "rev"),
        "REV*": ("📝 قيد المراجعة", "rev"),
        "RAR": ("⚠️ تقييم مخاطر", "rar")
    }
    status_label, status_class = status_labels.get(status, (status, ""))
    
    if is_prohibited:
        status_label = "🔴 محظور"
        status_class = "prohibited"
    
    st.markdown(f"""
    <div class="result-card">
        <div class="result-header">
            <span class="substance-name">{sub_name}</span>
            <span class="status-tag {status_class}">{status_label}</span>
        </div>
        <div class="result-details">
            <div class="detail-item">
                <span class="label">رقم CAS</span>
                <span class="value">{cas}</span>
            </div>
            <div class="detail-item">
                <span class="label">التصنيف</span>
                <span class="value">{category}</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def display_result_card(row, confidence, is_prohibited, status, extracted_text):
    sub_name = str(row["المادة الفعالة"])
    cas = str(row["رقم CAS"])
    category = str(row["التصنيف"])
    
    status_labels = {
        "Approved": ("✅ مسموح", "approved"),
        "REV": ("📝 قيد المراجعة العلمية", "rev"),
        "REV*": ("📝 قيد المراجعة العلمية", "rev"),
        "RAR": ("⚠️ تقييم مخاطر مطلوب", "rar")
    }
    status_label, status_class = status_labels.get(status, (status, ""))
    
    if is_prohibited:
        status_label = "🔴 محظور"
        status_class = "prohibited"
    
    conf_percent = int(confidence * 100)
    conf_class = "low" if conf_percent < 70 else ""
    
    risk_analysis = analyze_health_environmental_risks(sub_name, cas, status, is_prohibited)
    
    st.markdown(f"""
    <div class="result-card">
        <div class="result-header">
            <span class="substance-name">{sub_name}</span>
            <span class="status-tag {status_class}">{status_label}</span>
        </div>
        <div class="result-details">
            <div class="detail-item">
                <span class="label">رقم CAS</span>
                <span class="value">{cas}</span>
            </div>
            <div class="detail-item">
                <span class="label">التصنيف</span>
                <span class="value">{category}</span>
            </div>
        </div>
        <div class="confidence-bar">
            <div class="conf-label">
                <span>درجة التطابق</span>
                <span>{conf_percent}%</span>
            </div>
            <div class="track">
                <div class="fill {conf_class}" style="width:{conf_percent}%"></div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown(f"""
    <div class="regulation-card">
        <div class="reg-title">🌍 الوضع التنظيمي الدولي</div>
        <div class="reg-item">
            <span class="reg-icon">🇪🇺</span>
            <span><b>الاتحاد الأوروبي:</b> {risk_analysis.get('eu_status', 'غير محدد')}</span>
        </div>
        <div class="reg-item">
            <span class="reg-icon">🇺🇸</span>
            <span><b>الولايات المتحدة:</b> {risk_analysis.get('usa_status', 'غير محدد')}</span>
        </div>
        <div style="font-size: 10px; color: #8a9a8a; margin-top: 6px;">
            📌 {risk_analysis.get('source', 'المصدر: قاعدة بيانات التطبيق')}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    with st.expander("⚠️ تحليل المخاطر البيئية والصحية (للمحترفين)"):
        st.markdown(f"""
        **مستوى السمية:** {risk_analysis.get('toxicity', 'غير محدد')}
        
        **التأثير البيئي:** {risk_analysis.get('env_impact', 'غير محدد')}
        
        **المخاطر الصحية:** {risk_analysis.get('health_risks', 'غير محدد')}
        
        **إجراءات السلامة:** {risk_analysis.get('safety', 'اتبع تعليمات السلامة على العبوة')}
        """)

# ===================================================
# 16. شاشة السجل
# ===================================================
def show_history():
    st.subheader("📋 سجل الفحوصات")
    
    history = get_history()
    
    if not history:
        st.info("📭 لا توجد فحوصات سابقة")
        return
    
    if st.button("🗑️ مسح السجل"):
        clear_history()
        st.rerun()
    
    for entry in history[:20]:
        with st.container():
            st.markdown(f"""
            <div style="background: rgba(255,255,255,0.6); padding: 12px 16px; border-radius: 14px; margin-bottom: 8px; border-right: 4px solid #1a4a2a;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; color: #1a3a2a;">{entry.get('substance', 'غير معروف')}</span>
                    <span style="font-size: 11px; color: #6b7a6b;">{entry.get('timestamp', '')[:16]}</span>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 4px; font-size: 12px; color: #6b7a6b;">
                    <span>CAS: {entry.get('cas', 'N/A')}</span>
                    <span>{'🔴 محظور' if entry.get('prohibited') else '✅ مسموح'}</span>
                    <span>التطابق: {int(entry.get('confidence', 0) * 100)}%</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

# ===================================================
# 17. شاشة الإعدادات
# ===================================================
def show_settings():
    st.subheader("⚙️ الإعدادات")
    
    st.markdown("### 📊 معلومات قاعدة البيانات")
    if df_registered is not None:
        st.write(f"**إجمالي المواد المسجلة:** {len(df_registered)}")
        st.write(f"**المواد المحظورة:** {len(df_prohibited) if df_prohibited is not None else 0}")
        
        if not df_registered.empty:
            status_counts = df_registered["الحالة"].value_counts()
            st.write("**توزيع الحالات:**")
            for status, count in status_counts.items():
                st.write(f"- {status}: {count}")
    
    st.markdown("---")
    st.markdown("### 🌍 اللوائح الدولية المرجعية")
    st.markdown("""
    - 🇪🇺 **الاتحاد الأوروبي:** قاعدة بيانات المبيدات الرسمية (EU Pesticides Database)
    - 🇺🇸 **الولايات المتحدة:** قاعدة بيانات المواد الكيميائية السامة (EPA CompTox)
    - 📋 **المصادر:** يتم تحديث البيانات وفقاً للقرارات الرسمية
    """)
    
    st.markdown("---")
    st.markdown("### ℹ️ عن التطبيق")
    st.markdown("""
    **الإصدار:** 2.0 (2026)
    
    **المطور:** المهندس أبوبكر عبدالقادر الطشاني
    
    **الجهة:** وزارة الزراعة والثروة الحيوانية - درنة
    
    **المرجعية القانونية:**
    - قرار وزير الزراعة رقم (500) لسنة 2026م (المواد المسجلة)
    - قرار وزير الزراعة رقم (248) لسنة 2024م (المواد المحظورة)
    """)

# ===================================================
# 18. تشغيل التطبيق
# ===================================================
if __name__ == "__main__":
    main()