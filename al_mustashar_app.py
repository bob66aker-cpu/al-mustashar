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

# إخفاء عناصر النظام والفوتر والخانة السوداء الخاصة بالمشرف للزوار مع الحفاظ على مظهر احترافي
st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    div[data-testid="stStatusWidget"] {visibility: hidden;}
    .main-header {
        font-size: 2.2rem;
        color: #2e7d32;
        font-weight: bold;
        text-align: center;
        margin-bottom: 10px;
    }
    .sub-header {
        text-align: center;
        color: #555555;
        margin-bottom: 30px;
    }
    </style>
""", unsafe_allow_html=True)

# تحميل قارئ النصوص (EasyOCR)
@st.cache_resource
def load_reader():
    return easyocr.Reader(['ar', 'en'], gpu=False)

try:
    reader = load_reader()
except Exception:
    reader = None

# تحميل قاعدة البيانات بأمان
@st.cache_data
def load_data():
    if os.path.exists('pesticides_database_for_app.csv'):
        return pd.read_csv('pesticides_database_for_app.csv')
    return pd.DataFrame(columns=['المادة الفعالة', 'اسم المبيد', 'حالة التسجيل', 'تاريخ الانتهاء'])

df = load_data()

# الشريط الجانبي (Sidebar) وتنسيق الهوية والمطور
with st.sidebar:
    # عرض شعار الدرع إذا توفر
    if os.path.exists('shield_logo.png'):
        st.image('shield_logo.png', use_column_width=True)
    
    st.header("خيارات التطبيق")
    app_mode = st.radio("اختر القسم:", ["البحث والاستعلام", "فحص صورة المبيد (OCR)", "إرشادات التثبيت على الهاتف"])
    
    st.markdown("---")
    
    # قسم معلومات المطور (يظهر في الشريط الجانبي بشكل احترافي)
    st.markdown("### عن المطور")
    if os.path.exists('developer_photo.jpg'):
        st.image('developer_photo.jpg', width=120, caption="م. استشاري / خبير قانوني محلف")
    st.markdown("**مهندس زراعي استشاري**\n\nخبير قانوني محلف أمام القضاء")

# الهيدر الرئيسي للتطبيق
st.markdown('<div class="main-header">🛡️ المستشار الزراعي</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">النظام الذكي لفحص المبيدات الزراعية والتحقق من صلاحيتها ومطابقتها للقرارات التنظيمية</div>', unsafe_allow_html=True)

# القسم الأول: البحث والاستعلام
if app_mode == "البحث والاستعلام":
    st.subheader("🔍 الاستعلام عن المواد الفعالة والمبيدات")
    search_query = st.text_input("أدخل اسم المبيد أو المادة الفعالة للبحث:")
    
    if search_query and not df.empty:
        results = df[df.astype(str).apply(lambda row: row.str.contains(search_query, case=False).any(), axis=1)]
        if not results.empty:
            st.success(f"تم العثور على {len(results)} نتيجة مطابقة:")
            st.dataframe(results, use_container_width=True)
        else:
            st.warning("لم يتم العثور على نتائج مطابقة في قاعدة البيانات.")
    elif df.empty:
        st.info("قاعدة بيانات المبيدات غير متوفرة حالياً أو فارغة.")

# القسم الثاني: فحص صور المبيدات (OCR)
elif app_mode == "فحص صورة المبيد (OCR)":
    st.subheader("📷 التقاط أو رفع صورة ملصق المبيد")
    uploaded_file = st.file_uploader("اختر صورة العبوة أو الملصق (JPG, PNG)", type=["jpg", "jpeg", "png"])
    
    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        
        # معالجة مسبقة لزيادة التباين ورفع دقة التعرف البصري
        enhancer = ImageEnhance.Contrast(image)
        enhanced_image = enhancer.enhance(2.0)
        
        st.image(image, caption="الصورة المرفوعة", use_column_width=True)
        
        if st.button("بدء قراءة النص واستخراج المادة الفعالة"):
            if reader is not None:
                with st.spinner("جاري تحليل الصورة واستخراج النصوص بدقة..."):
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
                                if active_ingredient and active_ingredient in extracted_text:
                                    st.success(f"✅ تم مطابقة المادة الفعالة بنجاح: {active_ingredient}")
                                    st.write(row)
                                    match_found = True
                            if not match_found:
                                st.warning("لم يتم العثور على مطابقة مباشرة للمادة المستخرجة داخل قاعدة البيانات الرسمية.")
                    except Exception as ex:
                        st.error(f"حدث خطأ أثناء قراءة الصورة: {ex}")
            else:
                st.error("محرك التعرف البصري غير متوفر حالياً.")

# القسم الثالث: إرشادات التثبيت على الهاتف
elif app_mode == "إرشادات التثبيت على الهاتف":
    st.subheader("📱 كيفية تثبيت التطبيق على هاتفك المحمول (بدون متجر)")
    st.markdown("""
    لإبقاء التطبيق جاهزاً بنقرة واحدة على شاشة هاتفك ودون الحاجة للبحث عن الرابط في كل مرة:
    
    - **أجهزة أندرويد (متصفح كروم Chrome):**
      1. افتح رابط التطبيق من المتصفح.
      2. اضغط على القائمة العلوية (الثلاث نقاط رأسية).
      3. اختر **"إضافة إلى الشاشة الرئيسية" (Add to Home screen)** أو **"تثبيت التطبيق"**.
    
    - **أجهزة أيفون / آي باد (متصفح سفاري Safari):**
      1. افتح رابط التطبيق في سفاري.
      2. اضغط على زر المشاركة (مربع يخرج منه سهم للأعلى في الأسفل).
      3. انزل لأسفل القائمة واختر **"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)**.
      
    بمجرد القيام بذلك، ستظهر أيقونة التطبيق مباشرة بين تطبيقات هاتفك للوصول الفوري والسهل!
    """)