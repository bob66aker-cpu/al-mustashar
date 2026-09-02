import os
import streamlit as st
import pandas as pd
from PIL import Image, ImageEnhance
import easyocr
import io

# إعداد الصفحة وتكوين العرض
st.set_page_config(
    page_title="المستشار الزراعي",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# تنسيق CSS احترافي يضمن محاذاة RTL صحيحة ومنعكسة بشكل سليّم وتصميم أنيق
st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    div[data-testid="stStatusWidget"] {visibility: hidden;}
    
    .stApp {
        direction: rtl;
        text-align: right;
    }
    
    .main-title {
        font-size: 2.3rem;
        color: #1b5e20;
        font-weight: 800;
        text-align: center;
        margin-bottom: 5px;
    }
    
    .sub-title {
        text-align: center;
        color: #555555;
        font-size: 1.05rem;
        margin-bottom: 25px;
    }
    </style>
""", unsafe_allow_html=True)

# تحميل قارئ النصوص (EasyOCR) متعدد اللغات
@st.cache_resource
def load_reader():
    return easyocr.Reader(['ar', 'en', 'it', 'es', 'fr'], gpu=False)

try:
    reader = load_reader()
except Exception:
    reader = None

# تحميل قاعدة البيانات بأمان
@st.cache_data
def load_data():
    for filename in ['pesticides_database_for_app.csv', 'pesticides_database_for_app .csv']:
        if os.path.exists(filename):
            return pd.read_csv(filename)
    return pd.DataFrame(columns=['المادة الفعالة', 'اسم المبيد', 'حالة التسجيل', 'تاريخ الانتهاء'])

df = load_data()

# الشريط الجانبي (Sidebar) المنظم
with st.sidebar:
    if os.path.exists('shield_logo.png'):
        st.image('shield_logo.png', use_container_width=True)
    else:
        st.markdown("<h3 style='text-align: center;'>🛡️ المستشار الزراعي</h3>", unsafe_allow_html=True)
    
    st.markdown("---")
    st.header("لوحة التحكم والخيارات")
    
    # استعادة الخيارات الشاملة (للمزارعين، المهندسين، والفحص)
    app_mode = st.radio(
        "اختر القسم المطلوب:", 
        [
            "🌾 استعلام المزارعين والمهندسين", 
            "📷 فحص صورة المبيد (OCR الذكي)", 
            "📱 إرشادات التثبيت على الهاتف"
        ]
    )
    
    st.markdown("---")
    st.markdown("### عن المطور")
    if os.path.exists('developer_photo.jpg'):
        st.image('developer_photo.jpg', use_container_width=True, caption="م. استشاري / خبير قانوني محلف")
    st.markdown("**مهندس زراعي استشاري**\n\nخبير قانوني محلف أمام القضاء")

# الهيدر الرئيسي
st.markdown('<div class="main-title">المستشار الزراعي</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">النظام الذكي المعتمد لفحص المبيدات الزراعية والتحقق من صلاحيتها ومطابقتها للقرارات التنظيمية</div>', unsafe_allow_html=True)

# القسم الأول: استعلام المزارعين والمهندسين
if app_mode == "🌾 استعلام المزارعين والمهندسين":
    st.subheader("🔍 الاستعلام الميداني والفني عن المبيدات والمواد الفعالة")
    st.markdown("مرحباً بك. يتيح هذا القسم للمزارعين والمهندسين الاستعلام الفوري عن حالة التسجيل، صلاحية المبيدات، والمواد الفعالة المعتمدة.")
    
    search_query = st.text_input("أدخل اسم المبيد، المادة الفعالة، أو رقم التسجيل للبحث:")
    
    if search_query and not df.empty:
        results = df[df.astype(str).apply(lambda row: row.str.contains(search_query, case=False).any(), axis=1)]
        if not results.empty:
            st.success(f"تم العثور على {len(results)} نتيجة مطابقة:")
            st.dataframe(results, use_container_width=True)
        else:
            st.warning("لم يتم العثور على نتائج مطابقة في قاعدة البيانات الرسمية.")
    elif df.empty:
        st.info("قاعدة بيانات المبيدات غير متوفرة حالياً أو فارغة.")

# القسم الثاني: فحص صورة المبيد (OCR الذكي)
elif app_mode == "📷 فحص صورة المبيد (OCR الذكي)":
    st.subheader("📷 التقاط أو رفع صورة ملصق العبوة (دعم متعدد اللغات)")
    st.markdown("النظام يدعم قراءة النصوص باللغات العربية، الإنجليزية، واللاتينية (الإيطالية، الإسبانية، الفرنسية) مع معالجة تلقائية لتباين الحروف.")
    
    uploaded_file = st.file_uploader("اختر صورة ملصق المبيد (JPG, PNG)", type=["jpg", "jpeg", "png"])
    
    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        
        # معالجة مسبقة لتحسين الحروف الباهتة أو الناقصة
        enhancer = ImageEnhance.Contrast(image)
        enhanced_image = enhancer.enhance(2.2)
        
        col1, col2 = st.columns(2)
        with col1:
            st.image(image, caption="الصورة الأصلية", use_container_width=True)
        with col2:
            st.image(enhanced_image, caption="الصورة بعد معالجة التباين", use_container_width=True)
        
        if st.button("بدء تحليل النص واستخراج المادة الفعالة"):
            if reader is not None:
                with st.spinner("جاري تحليل الملصق وقراءة النصوص بدقة..."):
                    try:
                        img_byte_arr = io.BytesIO()
                        enhanced_image.save(img_byte_arr, format='PNG')
                        img_bytes = img_byte_arr.getvalue()
                        
                        results = reader.readtext(img_bytes)
                        extracted_text = " ".join([res[1] for res in results])
                        
                        st.info(f"النصوص المستخرجة من الملصق: {extracted_text}")
                        
                        if not df.empty and extracted_text:
                            match_found = False
                            for idx, row in df.iterrows():
                                active_ingredient = str(row.get('المادة الفعالة', ''))
                                if active_ingredient and active_ingredient.lower() in extracted_text.lower():
                                    st.success(f"✅ تم مطابقة المادة الفعالة بنجاح: {active_ingredient}")
                                    st.dataframe(pd.DataFrame([row]), use_container_width=True)
                                    match_found = True
                            if not match_found:
                                st.warning("لم يتم العثور على مطابقة مباشرة للمادة المستخرجة داخل قاعدة البيانات الرسمية.")
                    except Exception as ex:
                        st.error(f"حدث خطأ أثناء قراءة الصورة: {ex}")
            else:
                st.error("محرك التعرف البصري غير متوفر حالياً.")

# القسم الثالث: إرشادات التثبيت على الهاتف
elif app_mode == "📱 إرشادات التثبيت على الهاتف":
    st.subheader("📱 كيفية تثبيت التطبيق على هاتفك المحمول (بدون متجر)")
    st.markdown("""
    لإبقاء التطبيق جاهزاً بنقرة واحدة على شاشة هاتفك ودون الحاجة للبحث عن الرابط كل مرة:
    
    * **أجهزة أندرويد (متصفح كروم Chrome):**
      1. افتح رابط التطبيق من المتصفح.
      2. اضغط على القائمة العلوية (الثلاث نقاط رأسية).
      3. اختر **"إضافة إلى الشاشة الرئيسية" (Add to Home screen)** أو **"تثبيت التطبيق"**.
    
    * **أجهزة أيفون / آي باد (متصفح سفاري Safari):**
      1. افتح رابط التطبيق في سفاري.
      2. اضغط على زر المشاركة (مربع يخرج منه سهم للأعلى في الأسفل).
      3. انزل لأسفل القائمة واختر **"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)**.
      
    بمجرد القيام بذلك، ستظهر أيقونة التطبيق مباشرة بين تطبيقات هاتفك لخدمة الزملاء والمستفيدين!
    """)