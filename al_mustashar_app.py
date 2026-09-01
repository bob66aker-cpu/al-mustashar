import streamlit as st
import pandas as pd
import numpy as np
import os
import urllib.request
import re
from datetime import datetime, date
from PIL import Image

# 1. إعدادات الصفحة الأساسية لتظهر بشكل مثالي على الهواتف
st.set_page_config(
    page_title="المستشار الزراعي - دليل المبيدات الليبي",
    page_icon="🧪",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# 2. تخصيص المظهر وتصميم الواجهة باستخدام CSS وإخفاء أدوات Streamlit العلوية
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap');
    
    /* إخفاء عناصر streamlit العلوية القلم وشعار القط والمساعد */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    div[data-testid="stToolbar"] {visibility: hidden;}
    
    /* تغيير الخط الافتراضي للتطبيق */
    html, body, [class*="css"], .stMarkdown, p, h1, h2, h3, h4, span, label, button {
        font-family: 'Cairo', sans-serif !important;
        text-align: right;
        direction: rtl;
    }
    
    /* تصميم البطاقات الملونة الصارخة */
    .status-card {
        padding: 25px;
        border-radius: 15px;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        text-align: center;
        color: white !important;
    }
    .status-card h2, .status-card p {
        color: white !important;
        text-align: center !important;
    }
    .status-red {
        background: linear-gradient(135deg, #d32f2f, #b71c1c);
        border-right: 10px solid #5f0909;
    }
    .status-green {
        background: linear-gradient(135deg, #2e7d32, #1b5e20);
        border-right: 10px solid #0c2e0e;
    }
    .status-yellow {
        background: linear-gradient(135deg, #f57c00, #e65100);
        border-right: 10px solid #822c00;
    }
    .status-expired {
        background: linear-gradient(135deg, #7b1fa2, #4a148c);
        border-right: 10px solid #22003c;
    }
    
    /* تصميم ترويسة التطبيق */
    .app-header {
        background: linear-gradient(135deg, #1b5e20, #0c2e0e);
        padding: 20px;
        border-radius: 0 0 25px 25px;
        text-align: center;
        color: white;
        margin-bottom: 25px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .app-header h1 {
        color: white !important;
        font-size: 26px !important;
        font-weight: 800;
        margin-bottom: 5px;
    }
    .app-header p {
        color: #a5d6a7 !important;
        font-size: 14px !important;
        margin: 0;
    }
    
    /* شعار التطبيق المصمم بشكل أنيق */
    .motto-box {
        background-color: rgba(255, 255, 255, 0.15);
        padding: 6px 15px;
        border-radius: 20px;
        display: inline-block;
        margin-top: 10px;
    }
    .motto-text {
        font-size: 15px;
        font-weight: 700;
        color: #ffb300 !important;
        text-align: center;
        font-style: italic;
    }
</style>
""", unsafe_allow_html=True)

# 3. دالة تحميل الخط العربي لتقارير الـ PDF
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
        st.error("⚠️ ملف قاعدة البيانات `pesticides_database_for_app.csv` غير موجود! يرجى التأكد من رفعه على GitHub.")
        return pd.DataFrame()
    
    try:
        df = pd.read_csv(csv_file)
        df.columns = df.columns.str.replace('﻿', '').str.strip()
        return df
    except Exception as e:
        st.error(f"⚠️ حدث خطأ أثناء قراءة ملف قاعدة البيانات: {e}")
        return pd.DataFrame()

df_pesticides = load_data()

# 5. واجهة ترويسة التطبيق
st.markdown("""
<div class="app-header">
    <h1>تطبيق الـمُـسْـتَـشَـار الـزّرَاعِـي 🧪</h1>
    <p>منظومة تدقيق المبيدات والمواد الفعالة بوزارة الزراعة والثروة الحيوانية</p>
    <div class="motto-box">
        <span class="motto-text">« على قدر المعرفة تأتي المسؤولية »</span>
    </div>
</div>
""", unsafe_allow_html=True)

# 6. لوحة الإعداد والتطوير في الشريط الجانبي داخل Expander منظم
with st.sidebar:
    with st.expander("⚙️ لوحة الإعداد والتطوير والمعلومات"):
        st.markdown("### 🧑‍🏫 إعداد وتطوير")
        st.markdown("**المهندس: أبوبكر عبدالقادر الطشاني**")
        st.markdown("*وزارة الزراعة والثروة الحيوانية - درنة*")
        st.markdown("مؤسس منصة: **المستشار الزراعي الليبي**")
        st.markdown("---")
        st.markdown("### 📜 المرجعية القانونية:")
        st.markdown("1. **المواد المحظورة:** قرار وزير الزراعة رقم **(248) لسنة 2024م**.")
        st.markdown("2. **المواد المسجلة:** قرارات وزير الزراعة رقم **(500) ورقم (467) لسنة 2026م**.")
        st.markdown("---")
        st.markdown("### ⚠️ إخلاء المسؤولية:")
        st.markdown("<small>تطبيق خدمي إرشادي مستقل ومجاني لتسهيل الوصول للقرارات الرسمية للدولة الليبية.</small>", unsafe_allow_html=True)

# 7. التبديل بين وضع المزارع ووضع المفتش
mode = st.radio(
    "اختر وضع الاستخدام المناسب لك:",
    ["🧑‍🌾 وضع المزارع (فحص سريع)", "👮‍♂️ وضع المهندس والرقابة (تفصيلي وقانوني)"],
    index=0,
    horizontal=True
)

st.markdown("---")

# دالة تحليل التواريخ المكتشفة في النصوص (OCR)
def parse_date_from_text(text):
    patterns = [
        r'\b(0[1-9]|1[0-2])[\/\-](202\d|203\d)\b',
        r'\b(202\d|203\d)[\/\-](0[1-9]|1[0-2])\b',
        r'\b(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](202\d|203\d)\b',
        r'\b(202\d|203\d)[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])\b',
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

# ==================== 🧑‍🌾 أولاً: وضع المزارع البسيط ====================
if "وضع المزارع" in mode:
    st.subheader("🧑‍🌾 بوابة الفحص السريع للمزارع")
    st.info("ابحث باسم المادة الفعالة المكتوبة بالإنجليزية على العبوة أو استخدم الكاميرا لتلقي التنبيه فوراً.")
    
    tab_write, tab_camera = st.tabs(["✍️ البحث بالكتابة اليدوية", "📸 الفحص الذكي بالكاميرا"])
    
    found_substance = None
    scanned_expiry_date = None
    manual_expiry_expired = False
    expiry_date_input = None
    
    # حقل فحص الصلاحية بأسلوب آمن
    st.markdown("### 📅 فحص صلاحية المبيد (اختياري)")
    col_exp1, col_exp2 = st.columns(2)
    with col_exp1:
        has_expiry = st.checkbox("أريد فحص تاريخ صلاحية العبوة", value=False)
    with col_exp2:
        if has_expiry:
            expiry_date_input = st.date_input(
                "تاريخ انتهاء الصلاحية المكتوب على العبوة:",
                value=date(2026, 9, 1),
                min_value=date(2020, 1, 1),
                max_value=date(2035, 12, 31)
            )
            if expiry_date_input < date(2026, 9, 1):
                manual_expiry_expired = True

    # --- التبويب الأول: البحث اليدوي ---
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
            
    # --- التبويب الثاني: الكاميرا ---
    with tab_camera:
        uploaded_image = st.camera_input("وجه الكاميرا نحو ملصق المادة الفعالة على العبوة 📷")
        if uploaded_image:
            st.write("🔄 جاري تحليل النصوص والتواريخ...")
            try:
                import easyocr
                reader = easyocr.Reader(['en'], gpu=False)
                img = Image.open(uploaded_image)
                img_np = np.array(img)
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
                
                match_found = False
                for idx, row in df_pesticides.iterrows():
                    sub_name = str(row["المادة الفعالة (Active Substance)"]).strip()
                    if len(sub_name) > 3 and sub_name.lower() in extracted_text:
                        found_substance = row
                        match_found = True
                        st.info(f"🔎 المادة الفعالة المكتشفة تلقائياً: **{sub_name}**")
                        break
                        
                if not match_found:
                    st.warning("⚠️ لم يتم العثور على اسم مادة فعالة مطابقة بالصورة. يرجى تجربة البحث اليدوي.")
            except ImportError:
                st.error("⚠️ نظام OCR غير مفعل على السيرفر، يرجى استخدام البحث اليدوي.")
            except Exception as e:
                st.error(f"حدث خطأ أثناء فحص الصورة: {e}")

    # --- عرض النتيجة الملونة للمزارع ---
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
                <p style="font-size: 22px; font-weight: bold; margin: 10px 0;">المادة: {sub_name}</p>
                <p style="font-size: 16px;"><b>التاريخ المكتشف: {expired_date_str}</b></p>
                <p style="font-size: 15px; text-align: justify; padding: 0 10px;">
                    استخدام المبيد منتهي الصلاحية يشكل خطراً كبيراً لتحلل المادة الفعالة إلى مركب سام يسبب حرق المحاصيل وتسمم التربة.
                </p>
            </div>
            """, unsafe_allow_html=True)
            
        else:
            if str(color).lower() == "red":
                st.markdown(f"""
                <div class="status-card status-red">
                    <h2>🔴 مادة محظورة وممنوعة تماماً! ❌</h2>
                    <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">{sub_name}</p>
                    <p style="font-size: 16px;">ممنوع تركيبها أو استيرادها أو تداولها في ليبيا نهائياً.</p>
                    <p style="font-size: 14px; opacity: 0.9; margin-top: 15px;">⚠️ السند القانوني: قرار وزير الزراعة رقم 248 لسنة 2024م</p>
                </div>
                """, unsafe_allow_html=True)
                
            elif str(color).lower() == "green":
                st.markdown(f"""
                <div class="status-card status-green">
                    <h2>🟢 مادة مسموحة ومسجلة ✅</h2>
                    <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">{sub_name}</p>
                    <p style="font-size: 16px;">مسموح تداولها واستخدامها ومطابقة للمعايير المعتمدة.</p>
                    <p style="font-size: 14px; opacity: 0.9; margin-top: 15px;">📜 السند القانوني: قرار وزير الزراعة رقم 500 لسنة 2026م</p>
                </div>
                """, unsafe_allow_html=True)
                
            else:
                st.markdown(f"""
                <div class="status-card status-yellow">
                    <h2>⚠️ مادة خاضعة للمراجعة والقيود ⚠️</h2>
                    <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">{sub_name}</p>
                    <p style="font-size: 16px;">{status}</p>
                    <p style="font-size: 14px; opacity: 0.9; margin-top: 10px;"><b>تفصيل القانون:</b> {details}</p>
                </div>
                """, unsafe_allow_html=True)

# ==================== 👮‍♂️ ثانياً: وضع المهندس والمفتش ====================
else:
    st.subheader("👮‍♂️ بوابة الضبط والتفتيش والمهندسين الزراعيين")
    st.info("فحص دقيق ومباشر للشرطة الزراعية والمفتشين للحصول على أرقام CAS والسندات القانونية وإصدار محاشر الضبط.")
    
    with st.expander("🔍 دليل كشف تلاعب وغش تواريخ الصلاحية (للمفتشين)"):
        st.markdown("""
        ### 🛡️ علامات الغش والتلاعب بالتواريخ:
        1. **اختلاف حبر الطباعة:** الحبر المزيف يسهل مسحه أو كشطه بالكحول.
        2. **آثار الكشط:** وجود خدوش حول منطقة التاريخ بالعبوة.
        3. **تطابق التشغيلة (Batch Number):** مطابقة التشغيلة مع الفواتير الأصلية.
        4. **الترسبات والتكتل:** انفصال السائل أو تكتل البودرة دليل تلف المادة الفعالة.
        """)

    if not df_pesticides.empty:
        substances_list_eng = [""] + sorted(df_pesticides["المادة الفعالة (Active Substance)"].dropna().unique().tolist())
        selected_inspector_sub = st.selectbox(
            "🔎 اختر أو ابحث عن اسم المادة الفعالة بالإنجليزية (Active Ingredient):",
            substances_list_eng,
            key="inspector_select"
        )
        
        selected_row = None
        if selected_inspector_sub:
            selected_row = df_pesticides[df_pesticides["المادة الفعality (Active Substance)"] == selected_inspector_sub if "المادة الفعality (Active Substance)" in df_pesticides.columns else df_pesticides["المادة الفعالة (Active Substance)"] == selected_inspector_sub].iloc[0]
            
            sub_name = selected_row["المادة الفعالة (Active Substance)"]
            cas_num = selected_row["رقم CAS"]
            status = selected_row["الحالة"]
            color = selected_row["اللون الإرشادي"]
            details = selected_row["التفصيل والقرار"]
            
            # عرض بطاقة شاملة تفصيلية باللون المناسب
            if str(color).lower() == "red":
                st.markdown(f"""
                <div class="status-card status-red">
                    <h2>🔴 مادة محظورة وممنوعة قانوناً ❌</h2>
                    <p style="font-size: 22px; font-weight: bold; margin: 5px 0;">المادة: {sub_name}</p>
                    <p style="font-size: 16px;"><b>رقم CAS الدولي:</b> {cas_num}</p>
                    <p style="font-size: 15px; margin-top: 10px;"><b>القرار والسند:</b> {details}</p>
                </div>
                """, unsafe_allow_html=True)
            elif str(color).lower() == "green":
                st.markdown(f"""
                <div class="status-card status-green">
                    <h2>🟢 مادة مسجلة ومسموحة ✅</h2>
                    <p style="font-size: 22px; font-weight: bold; margin: 5px 0;">المادة: {sub_name}</p>
                    <p style="font-size: 16px;"><b>رقم CAS الدولي:</b> {cas_num}</p>
                    <p style="font-size: 15px; margin-top: 10px;"><b>القرار والسند:</b> {details}</p>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="status-card status-yellow">
                    <h2>⚠️ مادة خاضعة للقيود ⚠️</h2>
                    <p style="font-size: 22px; font-weight: bold; margin: 5px 0;">المادة: {sub_name}</p>
                    <p style="font-size: 16px;"><b>رقم CAS الدولي:</b> {cas_num}</p>
                    <p style="font-size: 15px; margin-top: 10px;"><b>القرار والسند:</b> {details}</p>
                </div>
                """, unsafe_allow_html=True)

        st.markdown("---")
        # ميزة "إثبات الحالة وتوليد محضر"
        st.markdown("### 📝 صياغة محضر ضبط وإثبات حالة مخالفة")
        
        col_form1, col_form2 = st.columns(2)
        with col_form1:
            inspector_name = st.text_input("اسم ضابط الرقابة / المفتش:", "مفتش الشرطة الزراعية")
            authority_name = st.text_input("الجهة الضبطية:", "جهاز الشرطة الزراعية - مكتب درنة")
            offense_type = st.selectbox("نوع المخالفة المرصودة:", ["تداول مادة فعالة محظورة زراعية وقانونياً ❌", "حيازة وتداول مبيد منتهي الصلاحية وتالف ⚠️"])
        with col_form2:
            location_name = st.text_input("مكان وسياق الضبط:", "محلات بيع المواد الزراعية")
            quantity_seized = st.text_input("الكمية المضبوطة:", "5 عبوات")
            default_sub_name = selected_inspector_sub if selected_inspector_sub else "أدخل اسم المادة"
            selected_substance_manual = st.text_input("اسم المادة الفعالة المضبوطة:", default_sub_name)
            
        if st.button("🖨️ توليد وحفظ تقرير ضبط وإثبات الحالة (PDF)"):
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