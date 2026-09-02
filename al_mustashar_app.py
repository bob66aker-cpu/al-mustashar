import os
import streamlit as st
import pandas as pd
from PIL import Image, ImageEnhance
import easyocr
import io

# إعداد الصفحة وتكوين العرض بكامل المساحة
st.set_page_config(
    page_title="المستشار الزراعي",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# تصميم وتنسيق CSS احترافي متناسق وداعم للغة العربية (RTL) وخالٍ من الأخطاء البصرية
st.markdown("""
    <style>
    /* إخفاء عناصر النظام والفوتر غير الضرورية للزوار */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    div[data-testid="stStatusWidget"] {visibility: hidden;}
    
    /* تنسيق عام لضمان محاذاة النص العربي بشكل مريح ونظيف */
    body {
        direction: rtl;
        text-align: right;
    }
    
    .main-title {
        font-size: 2.5rem;
        color: #1b5e20;
        font-weight: 800;
        text-align: center;
        margin-bottom: 5px;
    }
    
    .sub-title {
        text-align: center;
        color: #4f5b66;
        font-size: 1.1rem;
        margin-bottom: 25px;
        font-weight: 500;
    }
    
    .card-box {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #e0e0e0;
        margin-bottom: 20px;
    }
    </style>
""", unsafe_allow_html=True)

# تحميل قارئ النصوص (EasyOCR) ليدعم العربية، الإنجليزية، واللغات اللاتينية (الإيطالية، الإسبانية وغيرها)
@st.cache_resource
def load_reader():
    # دمج اللغات العربية والإنجليزية واللاتينية لضمان قراءة ملصقات المبيدات المستوردة بدقة قصوى
    return easyocr.Reader(['ar', 'en', 'it', 'es', 'fr'], gpu=False)

try:
    reader = load_reader()
except Exception:
    reader = None

# تحميل قاعدة البيانات بأمان تام
@st.cache_data
def load_data():
    # فحص مساحات الأسماء المحتملة للملف لضمان عدم حدوث خطأ في مسار الملف
    for filename in ['pesticides_database_for_app.csv', 'pesticides_database_for_app .csv']:
        if os.path.exists(filename):
            return pd.read_csv(filename)
    return pd.DataFrame(columns=['المادة الفعالة', 'اسم المبيد', 'حالة التسجيل', 'تاريخ الانتهاء'])

df = load_data()

# الشريط الجانبي (Sidebar) المنظم والهادئ
with st.sidebar:
    if os.path.exists('shield_logo.png'):
        st.image('shield_logo.png', use_container_width=True)
    else:
        st.markdown("<h2 style='text-align: center;'>🛡️ المستشار الزراعي</h2>", unsafe_allow_html=True)
    
    st.markdown("---")
    st.header("خيارات التطبيق")
    app_mode = st.radio("اختر القسم:", ["البحث والاستعلام", "فحص صورة المبيد (OCR)", "إرشادات التثبيت على الهاتف"])
    
    st.markdown("---")
    st.markdown("### عن المطور")
    if os.path.exists('developer_photo.jpg'):
        st.image('developer_photo.jpg', use_container_width=True, caption="م. استشاري / خبير قانوني محلف")
    st.markdown("**مهندس زراعي استشاري**\n\nخبير قانوني محلف أمام القضاء")

# العناوين الرئيسية للتطبيق بتنسيق نظيف ومريح للعين
st.markdown('<div class="main-title">🛡️ المستشار الزراعي</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">النظام الذكي المعتمد لفحص المبيدات الزراعية والتحقق من صلاحيتها ومطابقتها للقرارات التنظيمية</div>', unsafe_allow_html=True)

# القسم الأول: البحث والاستعلام
if app_mode == "البحث والاستعلام":
    st.markdown("### 🔍 الاستعلام المتقدم عن المواد الفعالة والمبيدات")
    search_query = st.text_input("أدخل اسم المبيد أو المادة الفعالة للبحث (بالعربية أو الإنجليزية):")
    
    if search_query and not df.empty:
        results = df[df.astype(str).apply(lambda row: row.str.contains(search_query, case=False).any(), axis=1)]
        if not results.empty:
            st.success(f"تم العثور على {len(results)} نتيجة مطابقة:")
            st.dataframe(results, use_container_width=True)
        else:
            st.warning("لم يتم العثور على نتائج مطابقة في قاعدة البيانات الرسمية.")
    elif df.empty:
        st.warning("تنبيه: قاعدة بيانات المبيدات غير متوفرة أو فارغة حالياً.")

# القسم الثاني: فحص صور المبيدات (OCR) مع الدعم اللاتيني المتقدم
elif app_mode == "فحص صورة المبيد (OCR)":
    st.markdown("### 📷 التقاط أو رفع صورة ملصق المبيد للتحليل الفوري")
    st.info("💡 دعم شامل لقراءة النصوص بالعربية، الإنجليزية، واللغات اللاتينية (الإيطالية، الإسبانية، الفرنسية) مع معالجة ذكية للتباين.")
    
    uploaded_file = st.file_uploader("اختر صورة العبوة أو الملصق (JPG, PNG)", type=["jpg", "jpeg", "png"])
    
    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        
        # معالجة مسبقة متقدمة للصور لرفع جودة الحروف الباهتة أو الناقصة
        enhancer = ImageEnhance.Contrast(image)
        enhanced_image = enhancer.enhance(2.2)
        
        col1, col2 = st.columns(2)
        with col1:
            st.image(image, caption="الصورة الأصلية المرفوعة", use_container_width=True)
        with col2:
            st.image(enhanced_image, caption="الصورة بعد المعالجة وتحسين التباين", use_container_width=True)
        
        if st.button("🚀 بدء تحليل النص واستخراج المادة الفعالة"):
            if reader is not None:
                with st.spinner("جاري قراءة الملصق واستخراج المواد الكيميائية بدقة عالية..."):
                    try:
                        img_byte_arr = io.BytesIO()
                        enhanced_image.save(img_byte_arr, format='PNG')
                        img_bytes = img_byte_arr.getvalue()
                        
                        results = reader.readtext(img_bytes)
                        extracted_text = " ".join([res[1] for res in results])
                        
                        st.markdown(f"**النصوص المستخرجة من الملصق:**")
                        st.code(extracted_text, language="text")
                        
                        if not df.empty and extracted_text:
                            match_found = False
                            for idx, row in df.iterrows():
                                active_ingredient = str(row.get('المادة الفعالة', ''))
                                # مطابقة مرنة تتغلب على تباين الحروف
                                if active_ingredient and active_ingredient.lower() in extracted_text.lower():
                                    st.success(f"✅ تم مطابقة المادة الفعالة بنجاح: {active_ingredient}")
                                    st.dataframe(pd.DataFrame([row]), use_container_width=True)
                                    match_found = True
                            if not match_found:
                                st.warning("لم يتم العثور على مطابقة مباشرة للمادة المستخرجة داخل قاعدة البيانات الرسمية. يرجى التحقق يدوياً.")
                    except Exception as ex:
                        st.error(f"حدث خطأ أثناء معالجة الصورة: {ex}")
            else:
                st.error("محرك التعرف البصري غير محمل بشكل صحيح.")

# القسم الثالث: إرشادات التثبيت على الهاتف
elif app_mode == "إرشادات التثبيت على الهاتف":
    st.markdown("### 📱 دليل تثبيت التطبيق على هاتفك المحمول (بدون متجر)")
    st.markdown("""
    لإبقاء التطبيق جاهزاً بنقرة واحدة على شاشة هاتفك ودون الحاجة للبحث عن الرابط في كل مرة:
    
    * **أجهزة أندرويد (متصفح كروم Chrome):**
      1. افتح رابط التطبيق من المتصفح.
      2. اضغط على القائمة العلوية (الثلاث نقاط رأسية).
      3. اختر **"إضافة إلى الشاشة الرئيسية" (Add to Home screen)** أو **"تثبيت التطبيق"**.
    
    * **أجهزة أيفون / آي باد (متصفح سفاري Safari):**
      1. افتح رابط التطبيق في سفاري.
      2. اضغط على زر المشاركة (مربع يخرج منه سهم للأعلى في الأسفل).
      3. انزل لأسفل القائمة واختر **"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)**.
      
    بمجرد القيام بذلك، ستظهر أيقونة التطبيق مباشرة بين تطبيقات هاتفك للوصول الفوري والسهل لخدمة 53 ألف زميل ومستفيد!
    """)