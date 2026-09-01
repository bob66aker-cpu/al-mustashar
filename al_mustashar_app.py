import streamlit as st
import pandas as pd
import numpy as np
import os
import urllib.request
import re
from datetime import datetime
from PIL import Image

# 1. إعدادات الصفحة الأساسية لتظهر بشكل مثالي على الهواتف
st.set_page_config(
    page_title="المستشار - دليل المبيدات الليبي",
    page_icon="🌱",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# 2. تخصيص المظهر وتصميم الواجهة باستخدام CSS لتبدو كتطبيق هاتف حديث
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap');
    
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
    
    /* شعار التطبيق */
    .motto-text {
        font-size: 16px;
        font-weight: bold;
        color: #ffb300 !important;
        text-align: center;
        margin-top: 5px;
        font-style: italic;
    }
    
    /* إخفاء عناصر streamlit غير الضرورية للمظهر الاحترافي */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
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

# تفعيل تحميل الخط في الخلفية
download_arabic_font()

# 4. دالة تحميل قاعدة البيانات
@st.cache_data
def load_data():
    csv_file = "pesticides_database_for_app.csv"
    # إذا لم يجد الملف بالامتداد .csv، نبحث عنه بدون امتداد في حال تم رفعه بدون امتداد على GitHub
    if not os.path.exists(csv_file):
        csv_file = "pesticides_database_for_app"
    
    # وإذا لم يجده بكلا الاسمين، نبحث عن أي ملف يحتوي على كلمة pesticides_database
    if not os.path.exists(csv_file):
        all_files = os.listdir('.')
        for f in all_files:
            if "pesticides_database" in f:
                csv_file = f
                break

    if not os.path.exists(csv_file):
        st.error("⚠️ ملف قاعدة البيانات `pesticides_database_for_app.csv` غير موجود بجوار هذا الملف البرمجي! يرجى التأكد من رفع ملف قاعدة البيانات بالشكل الصحيح.")
        return pd.DataFrame()
    
    try:
        df = pd.read_csv(csv_file)
        df.columns = df.columns.str.replace('﻿', '').str.strip()
        return df
    except Exception as e:
        st.error(f"⚠️ حدث خطأ أثناء قراءة ملف قاعدة البيانات: {e}")
        return pd.DataFrame()

df_pesticides = load_data()

# 5. واجهة ترويسة التطبيق المميزة
st.markdown("""
<div class="app-header">
    <h1>تطبيق الـمُـسْـتَـشَـار 🌱</h1>
    <p>دليل المبيدات الزراعية والمواد الفعالة في ليبيا</p>
    <div class="motto-text">"على قدر المعرفة تأتي المسؤولية"</div>
</div>
""", unsafe_allow_html=True)

# معلومات المبادرة في الشريط الجانبي
with st.sidebar:
    st.markdown("### 🧑‍🏫 إعداد وتطوير")
    st.markdown("**المهندس: أبوبكر عبدالقادر الطشاني**")
    st.markdown("*وزارة الزراعة والثروة الحيوانية - درنة*")
    st.markdown("مؤسس منصة: **المستشار الزراعي الليبي** (50 ألف عضو)")
    st.markdown("---")
    st.markdown("### 📜 المرجعية القانونية للبيانات:")
    st.markdown("1. **المواد المحظورة:** قرار وزير الزراعة رقم **(248) لسنة 2024م**.")
    st.markdown("2. **المواد المسجلة:** قرارات وزير الزراعة رقم **(500) ورقم (467) لسنة 2026م**.")
    st.markdown("---")
    st.markdown("### ⚠️ إخلاء المسؤولية:")
    st.markdown("<small>تطبيق خدمي إرشادي مستقل ومجاني لتسهيل الوصول للقرارات الرسمية للدولة الليبية.</small>", unsafe_allow_html=True)

# 6. التبديل بين وضع المزارع ووضع المفتش
mode = st.radio(
    "اختر وضع الاستخدام المناسب لك:",
    ["🧑‍🌾 وضع المزارع البسيط (بحث وفحص بصري سريع)", "👮‍♂️ وضع المهندس والرقابة (تفصيلي وقانوني)"],
    index=0,
    horizontal=True
)

st.markdown("---")

# دالة تحليل التواريخ المكتشفة في النصوص (OCR)
def parse_date_from_text(text):
    # محاولة البحث عن تاريخ بصيغ متعددة
    # مثل: 12/2025, 05-2026, 2027/11, 31/12/2025, 2026-08-15
    patterns = [
        r'\b(0[1-9]|1[0-2])[\/\-](202\d|203\d)\b', # MM/YYYY or MM-YYYY
        r'\b(202\d|203\d)[\/\-](0[1-9]|1[0-2])\b', # YYYY/MM or YYYY-MM
        r'\b(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](202\d|203\d)\b', # DD/MM/YYYY
        r'\b(202\d|203\d)[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])\b', # YYYY-MM-DD
    ]
    
    found_dates = []
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for m in matches:
            # معالجة المطابقات
            if len(m) == 2: # MM and YYYY
                if len(m[0]) == 2 and len(m[1]) == 4:
                    month, year = int(m[0]), int(m[1])
                else:
                    year, month = int(m[0]), int(m[1])
                found_dates.append((year, month))
            elif len(m) == 3: # DD, MM, YYYY
                if len(m[0]) == 4: # YYYY-MM-DD
                    year, month, day = int(m[0]), int(m[1]), int(m[2])
                else: # DD/MM/YYYY
                    day, month, year = int(m[0]), int(m[1]), int(m[2])
                found_dates.append((year, month))
    return found_dates

# تاريخ اليوم الفعلي للمطابقة والتحقق (2026-09)
CURRENT_YEAR = 2026
CURRENT_MONTH = 9

# ==================== 🧑‍🌾 أولاً: وضع المزارع البسيط ====================
if "وضع المزارع" in mode:
    st.subheader("🧑‍🌾 بوابة الفحص السريع للمزارع")
    st.info("ابحث باسم المادة الفعالة بالإنجليزية المكتوبة على العبوة أو استخدم الكاميرا لقراءتها وتلوين الشاشة فوراً.")
    
    # خياران للبحث: كتابة أو تصوير
    tab_write, tab_camera = st.tabs(["✍️ البحث بالكتابة اليدوية", "📸 الفحص الذكي بالكاميرا"])
    
    found_substance = None
    scanned_expiry_date = None
    manual_expiry_expired = False
    
    # حقل إدخال تاريخ الصلاحية الاختياري للتأكد من الصلاحية
    st.markdown("### 📅 فحص صلاحية المبيد (اختياري)")
    col_exp1, col_exp2 = st.columns(2)
    with col_exp1:
        has_expiry = st.checkbox("أريد فحص صلاحية المبيد (تاريخ الانتهاء)", value=False)
    with col_exp2:
        if has_expiry:
            expiry_date_input = st.date_input(
                "تاريخ انتهاء الصلاحية المكتوب على العبوة:",
                value=datetime(2026, 9, 1),
                min_value=datetime(2020, 1, 1),
                max_value=datetime(2035, 12, 31)
            )
            # مقارنة تاريخ اليوم (سبتمبر 2026) بالتاريخ المدخل
            if expiry_date_input < datetime(2026, 9, 1):
                manual_expiry_expired = True
    
    # --- التبويب الأول: البحث بالكتابة اليدوية ---
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
            st.warning("يرجى التأكد من رفع ملف قاعدة البيانات المرفق.")
            
    # --- التبويب الثاني: الفحص الذكي بالكاميرا ---
    with tab_camera:
        uploaded_image = st.camera_input("وجه كاميرا الهاتف نحو ملصق المادة الفعالة وتاريخ الصلاحية على العبوة 📷")
        if uploaded_image:
            st.write("🔄 جاري قراءة الحروف والتواريخ من الصورة ومطابقتها...")
            try:
                import easyocr
                reader = easyocr.Reader(['en'], gpu=False)
                img = Image.open(uploaded_image)
                img_np = np.array(img)
                results = reader.readtext(img_np)
                
                # تجميع النص المستخرج
                extracted_text = " ".join([res[1] for res in results]).lower()
                st.success("🤖 تم فحص النصوص والملصق بنجاح!")
                
                # 1. البحث عن التواريخ تلقائياً عبر الكاميرا
                dates_found = parse_date_from_text(extracted_text)
                if dates_found:
                    # نأخذ تاريخاً ونفترض أنه تاريخ الصلاحية للتحقق
                    # إذا وجدنا تاريخاً في الماضي (قبل سبتمبر 2026) فغالباً هذا هو تاريخ الانتهاء المنقضي
                    for y, m in dates_found:
                        if y < CURRENT_YEAR or (y == CURRENT_YEAR and m < CURRENT_MONTH):
                            scanned_expiry_date = f"{m:02d}/{y}"
                            break
                        else:
                            # تاريخ مستقبلي (مبيد ساري)
                            scanned_expiry_date = f"{m:02d}/{y}"
                
                # 2. البحث عن اسم المادة الفعالة
                match_found = False
                for idx, row in df_pesticides.iterrows():
                    sub_name = str(row["المادة الفعالة (Active Substance)"]).strip()
                    if len(sub_name) > 3 and sub_name.lower() in extracted_text:
                        found_substance = row
                        match_found = True
                        st.info(f"🔎 المادة الفعالة المكتشفة تلقائياً: **{sub_name}**")
                        break
                        
                if not match_found:
                    st.warning("⚠️ لم يتم العثور على اسم مادة فعالة مطابقة في الصورة. يرجى محاولة التقاط صورة أوضح أو البحث بالكتابة اليدوية.")
            except ImportError:
                st.error("⚠️ لم يتم تفعيل نظام الكاميرا الذكية (EasyOCR) على خادم الويب بعد. يرجى استخدام البحث اليدوي في الوقت الحالي.")
            except Exception as e:
                st.error(f"حدث خطأ أثناء فحص الصورة: {e}")

    # --- عرض النتيجة الملونة للمزارع (الإشارة الضوئية الفورية) ---
    if found_substance is not None:
        sub_name = found_substance["المادة الفعالة (Active Substance)"]
        cas_num = found_substance["رقم CAS"]
        status = found_substance["الحالة"]
        color = found_substance["اللون الإرشادي"]
        details = found_substance["التفصيل والقرار"]
        
        # أولاً: التحقق من الصلاحية (سواء بالكاميرا أو الإدخال اليدوي)
        is_expired = False
        expired_date_str = ""
        
        if manual_expiry_expired:
            is_expired = True
            expired_date_str = expiry_date_input.strftime('%d/%m/%Y')
        elif scanned_expiry_date:
            # التحقق مما إذا كان التاريخ المكتشف بالكاميرا منتهياً
            m, y = map(int, scanned_expiry_date.split('/'))
            if y < CURRENT_YEAR or (y == CURRENT_YEAR and m < CURRENT_MONTH):
                is_expired = True
                expired_date_str = scanned_expiry_date

        # حالة المبيد منتهي الصلاحية (الأرجواني/البنفسجي الصارخ للتنبيه الفوري)
        if is_expired:
            st.markdown(f"""
            <div class="status-card status-expired">
                <h2>⚠️ خطر: مبيد منتهي الصلاحية وتالف! ❌</h2>
                <p style="font-size: 22px; font-weight: bold; margin: 10px 0;">المادة: {sub_name}</p>
                <p style="font-size: 16px;"><b>تاريخ انتهاء الصلاحية المكتشف: {expired_date_str}</b></p>
                <p style="font-size: 15px; text-align: justify; padding: 0 10px;">
                    رغم أن هذه المادة قد تكون مسجلة أو مسموحة في القوائم الرسمية، إلا أن استخدام المبيد بعد انتهاء صلاحيته يشكل خطراً كبيراً حيث تتحلل المادة الفعالة إلى مركبات كيميائية سامة قد تسبب حرقاً للمحاصيل، تسمماً للمزارع، وفشلاً تاماً في مكافحة الآفات.
                </p>
            </div>
            """, unsafe_allow_html=True)
            
        # الحالات الطبيعية إذا لم يكن منتهياً
        else:
            if str(color).lower() == "red":
                st.markdown(f"""
                <div class="status-card status-red">
                    <h2>🔴 مادة محظورة وممنوعة تماماً! ❌</h2>
                    <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">{sub_name}</p>
                    <p style="font-size: 16px;">ممنوع تركيبها، استيرادها، أو تداولها في دولة ليبيا نهائياً ويُعاقب عليها القانون.</p>
                    <p style="font-size: 14px; opacity: 0.9; margin-top: 15px;">⚠️ السند القانوني: قرار وزير الزراعة رقم 248 لعام 2024م</p>
                </div>
                """, unsafe_allow_html=True)
                
            elif str(color).lower() == "green":
                st.markdown(f"""
                <div class="status-card status-green">
                    <h2>🟢 مادة مسموحة ومسجلة ✅</h2>
                    <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">{sub_name}</p>
                    <p style="font-size: 16px;">مسموح تداولها واستخدامها في دولة ليبيا ومطابقة للمعايير الوطنية المعتمدة.</p>
                    <p style="font-size: 14px; opacity: 0.9; margin-top: 15px;">📜 السند القانوني: قرار وزير الزراعة رقم 500 لسنة 2026م</p>
                </div>
                """, unsafe_allow_html=True)
                
            else: # Yellow / Orange / Restricted
                st.markdown(f"""
                <div class="status-card status-yellow">
                    <h2>⚠️ مادة خاضعة للمراجعة والقيود (انتبه) ⚠️</h2>
                    <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">{sub_name}</p>
                    <p style="font-size: 16px;">{status}</p>
                    <p style="font-size: 14px; opacity: 0.9; margin-top: 10px;"><b>تفصيل القانون:</b> {details}</p>
                </div>
                """, unsafe_allow_html=True)

# ==================== 👮‍♂️ ثانياً: وضع المهندس والمفتش ورجل الأمن ====================
else:
    st.subheader("👮‍♂️ بوابة الضبط والتفتيش والمهندسين")
    st.info("تتيح هذه البوابة للمفتشين والشرطة الزراعية الحصول على المرجعية الفنية الكاملة وأرقام CAS والقرارات الرسمية لإصدار محاضر الضبط الفورية.")
    
    # إضافة دليل فني لكشف تلاعب تواريخ الصلاحية داخل شاشة المفتش
    with st.expander("🔍 دليل كشف تلاعب وغش تواريخ الصلاحية والعبوات (للمفتشين والشرطة)"):
        st.markdown("""
        ### 🛡️ كيف يكشف المفتش المحترف تلاعب التجار بالتواريخ؟
        
        يسعى بعض التجار المتلاعبين إلى بيع المبيدات منتهية الصلاحية بعد تزوير تاريخ العبوة. إليك أهم العلامات الفنية لكشف هذا الغش في الحقل:
        
        1. **اختلاف نوع وجودة الحبر (Ink Mismatch):**
           * عادة ما تُطبع التواريخ الأصلية في المصانع الكبرى بواسطة طابعات ليزرية أو نافثة للحبر مشفرة على البلاستيك مباشرة باللون الأسود أو الأزرق الداكن وتكون صعبة المسح.
           * التواريخ المزورة تُطبع غالباً محلياً باستخدام حبر رخيص يسهل كشطه بالإصبع أو استخدام مادة كحولية أو أسيتون.
           
        2. **آثار الكشط والتنظيف (Scraping & Cleaning Marks):**
           * تفقد بدقة خلفية مكان التاريخ؛ إذا كانت هناك خدوش دقيقة، أو بهتان في لون البلاستيك أو الملصق في تلك المنطقة، فهذا يدل على استخدام شفرة أو كحول لمسح التاريخ القديم قبل طباعة الجديد.
           
        3. **تطابق رقم التشغيلة/الدفعة (Batch/Lot Number Matching):**
           * كل عبوة تحتوي على رقم تشغيلة (Batch Number). قم بمطابقة تاريخ الصلاحية مع رقم التشغيلة إن أمكن بالاتصال مع الموزع المعتمد أو مراجعة الفواتير الأصلية للشحنة.
           
        4. **فحص الرمز الشريطي (Barcode Validation):**
           * استخدم قارئ الباركود لمطابقة بلد المنشأ والشركة المصنعة؛ إذا كان الباركود لشركة معينة بينما العبوة تحمل ملصقاً لشركة أخرى، فالعبوة مغشوشة بالكامل.
           
        5. **التغيرات الفيزيائية للمبيد (Physical Changes):**
           * **المبيدات السائلة:** ترسب المادة الفعالة في الأسفل وتكون طبقة صلبة لا تختلط بالرج، أو تغير لون السائل، أو تصاعد روائح غريبة غير معتادة للمبيد.
           * **البودرة (WP/SP):** تكتل البودرة وتحولها إلى كتل صلبة صعبة الذوبان في الماء نتيجة لامتصاص الرطوبة أو تحللها.
        """)

    if not df_pesticides.empty:
        col_search_name, col_search_cas = st.columns(2)
        
        with col_search_name:
            search_name = st.text_input("📝 ابحث باسم المادة (Active Substance):", "")
        with col_search_cas:
            search_cas = st.text_input("🔢 ابحث برقم الـ CAS الدولي:", "")
            
        filtered_df = df_pesticides.copy()
        if search_name:
            filtered_df = filtered_df[filtered_df["المادة الفعالة (Active Substance)"].str.contains(search_name, case=False, na=False)]
        if search_cas:
            filtered_df = filtered_df[filtered_df["رقم CAS"].str.contains(search_cas, case=False, na=False)]
            
        st.write(f"📊 عدد المواد المطابقة للبحث: **{len(filtered_df)} مادة فعالة**")
        
        st.dataframe(
            filtered_df[["المادة الفعالة (Active Substance)", "رقم CAS", "الحالة", "التفصيل والقرار"]],
            use_container_width=True
        )
        
        # ميزة "إثبات الحالة وتوليد محضر" للشرطة والحرس البلدي
        st.markdown("### 📝 صياغة محضر ضبط وإثبات حالة مخالفة")
        st.write("إذا وجدت مادة محظورة، أو مبيداً منتهي الصلاحية وتالفاً، يمكنك تعبئة الحقول التالية لتوليد تقرير ضبط فني منسق وجاهز للحفظ بصيغة PDF لطباعته وإرفاقه مع محضر الضبط الرسمي.")
        
        col_form1, col_form2 = st.columns(2)
        with col_form1:
            inspector_name = st.text_input("اسم ضابط الرقابة / المفتش:", "مفتش الشرطة الزراعية")
            authority_name = st.text_input("الجهة الضبطية (مثال: الحرس البلدي / الشرطة الزراعية):", "جهاز الشرطة الزراعية - مكتب درنة")
            offense_type = st.selectbox("نوع المخالفة المرصودة:", ["تداول مادة فعالة محظورة زراعية وقانونياً ❌", "حيازة وتداول مبيد منتهي الصلاحية وتالف ⚠️"])
        with col_form2:
            location_name = st.text_input("مكان وسياق الضبط (مثال: محل زراعي - درنة):", "محلات بيع المواد الزراعية")
            quantity_seized = st.text_input("الكمية المضبوطة (عدد العبوات/الصناديق):", "5 عبوات")
            selected_substance_manual = st.text_input("اسم المادة الفعالة أو المبيد المضبوط ومجموعته:", "أدخل اسم المادة أو المبيد")
            
        # زر لتوليد وطباعة المحضر
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
                
                # تعبئة بيانات المحضر والضبط
                pdf.cell(190, 10, txt=clean_ar(f"اسم المفتش الرقابي المسؤول: {inspector_name}"), ln=True, align="R")
                pdf.cell(190, 10, txt=clean_ar(f"الجهة الضبطية الرسمية: {authority_name}"), ln=True, align="R")
                pdf.cell(190, 10, txt=clean_ar(f"مكان وسياق الضبط: {location_name}"), ln=True, align="R")
                pdf.cell(190, 10, txt=clean_ar(f"الكمية المضبوطة والمتحفظ عليها: {quantity_seized}"), ln=True, align="R")
                pdf.cell(190, 10, txt=clean_ar(f"نوع المخالفة: {offense_type}"), ln=True, align="R")
                pdf.ln(5)
                pdf.line(10, 85, 200, 85)
                pdf.ln(5)
                
                # بيانات المادة الفعالة
                pdf.cell(190, 10, txt=clean_ar(f"المبيد / المادة الفعالة المضبوطة: {selected_substance_manual}"), ln=True, align="R")
                
                if "محظورة" in offense_type:
                    pdf.cell(190, 10, txt=clean_ar("الحالة القانونية للمادة: محظورة وممنوعة تماماً من التداول والتركيب في ليبيا."), ln=True, align="R")
                    pdf.cell(190, 10, txt=clean_ar("السند التشريعي: قرار نائب رئيس مجلس الوزراء ووزير الزراعة رقم (248) لسنة 2024م."), ln=True, align="R")
                else:
                    pdf.cell(190, 10, txt=clean_ar("الحالة الفنية والقانونية: مبيد منتهي الصلاحية وتالف، تمنع التشريعات الوطنية استخدامه."), ln=True, align="R")
                    pdf.cell(190, 10, txt=clean_ar("الأثر الفني: المادة الفعالة تالفة وقد تحللت إلى نواتج سامة تهدد التربة والصحة العامة."), ln=True, align="R")
                
                pdf.ln(10)
                
                # شروط التوقيع القانوني
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
                st.success("✅ تم توليد تقرير الضبط والمطابقة الفنية بنجاح! يرجى الضغط على زر التحميل في الأعلى لحفظ وطباعة الملف لإرفاقه بالمحضر الرسمي.")
            except Exception as e:
                st.error(f"حدث خطأ أثناء صياغة تقرير الـ PDF: {e}")
                st.info("ملاحظة: يتطلب تشغيل ميزة توليد الـ PDF مكتبات `fpdf2` و `arabic-reshaper` و `python-bidi` مثبتة على الخادم.")
                
    else:
        st.warning("يرجى التأكد من رفع ملف قاعدة البيانات المرفق.")
