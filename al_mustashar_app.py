import os
import re
from datetime import datetime
import cv2
import numpy as np
import pandas as pd
from PIL import Image
import streamlit as st

# محاولة استيراد EasyOCR مع معالجة الخطا في حال عدم التوفر المحلي
try:
  import easyocr

  HAS_EASYOCR = True
except ImportError:
  HAS_EASYOCR = False

# محاولة استيراد مكتبة التقارير FPDF
try:
  from fpdf import FPDF

  HAS_FPDF = True
except ImportError:
  HAS_FPDF = False

# إعدادات الصفحة
st.set_page_config(
    page_title="المستشار الزراعي - النظام المتكامل",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# تخصيص التصميم وإخفاء العناصر غير الضرورية (التثبيت والتنظيف البصري)
st.markdown(
    """
    <style>
    .main {
        direction: rtl;
        text-align: right;
    }
    .stSelectbox, .stTextInput, .stButton {
        direction: rtl;
    }
    /* كود جافاسكريبت وبرمجية لتنبيه المتصفح الداخلي لتطبيقات التواصل */
    </style>
    
    <script>
    // كشف ما إذا كان المستخدم يفتح التطبيق من خلال متصفح فيسبوك أو انستغرام الداخلي
    window.addEventListener('load', function() {
        var ua = navigator.userAgent || navigator.vendor || window.opera;
        if (ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1 || ua.indexOf("Instagram") > -1) {
            // إنشاء شريط تنبيه علوي يحث المستخدم على الفتح في المتصفح الخارجي
            var banner = document.createElement('div');
            banner.style.position = 'fixed';
            banner.style.top = '0';
            banner.style.left = '0';
            banner.style.width = '100%';
            banner.style.backgroundColor = '#ff4b4b';
            banner.style.color = 'white';
            banner.style.padding = '12px';
            banner.style.textAlign = 'center';
            banner.style.zIndex = '999999';
            banner.style.fontWeight = 'bold';
            banner.style.fontSize = '14px';
            banner.innerHTML = '⚠️ أنت تفتح التطبيق من متصفح فيسبوك الداخلي. لتثبيته على هاتفك، اضغط على النقاط الثلاث بالأعلى واختر "فتح في متصفح كروم أو سفاري".';
            document.body.prepend(banner);
        }
    });
    </script>
    """,
    unsafe_allow_html=True,
)

# عنصر واجهة إضافي لتوجيه المستخدم في حال كان على الهاتف ولم تظهر خانة التثبيت
st.markdown(
    """
    <div style="background-color: #f0f2f6; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; border: 1px solid #dcdcdc;">
        <span style="font-size: 14px; color: #333;">📱 <b>هل تواجه مشكلة في تثبيت التطبيق على هاتفك؟</b> تأكد من فتح الرابط في متصفح <b>Google Chrome</b> (أندرويد) أو <b>Safari</b> (آيفون) الخارجي وليس من داخل تطبيق فيسبوك أو واتساب لتظهر لك أيقونة "إضافة إلى الشاشة الرئيسية".</span>
    </div>
    """,
    unsafe_allow_html=True,
)


# تحميل قاعدة بيانات المبيدات والقرارات التنظيمية
@st.cache_data
def load_pesticides_data():
  # قاعدة بيانات نموذجية مدمجة او محملة من ملف CSV إن وجد
  csv_file = "pesticides_database_for_app.csv"
  if os.path.exists(csv_file):
    try:
      df = pd.read_csv(csv_file)
      df.columns = df.columns.str.replace("﻿", "").str.strip()
      return df
    except Exception:
      pass

  # بيانات افتراضية أساسية في حال عدم وجود الملف لتجنب توقف التطبيق
  data = {
      "المادة الفعالة (Active Substance)": [
          "Abamectin",
          "Acetamiprid",
          "Azoxystrobin",
          "Chlorpyrifos",
          "Glyphosate",
          "Mancozeb",
      ],
      "الحالة": [
          "مسموح بضوابط",
          "مسموح",
          "مسموح",
          "محظور",
          "مسموح بضوابط",
          "محظور",
      ],
      "اللون الإرشادي": ["أصفر", "أخضر", "أخضر", "أحمر", "أصفر", "أحمر"],
      "التفصيل والقرار": [
          "يُستخدم وفقاً لتعليمات بطاقة العبوة وفترة الأمان.",
          "مبيد جهازية آمن نسبياً عند الالتزام بالجرعات.",
          "مركب وقائي وعلاجي واسع النطاق.",
          "محظور بموجب القرارات التنظيمية لحماية البيئة والصحة.",
          "مبيد عشبي عام، يُستخدم بحذر وفقاً للتشريعات.",
          "محظور وفقاً للمواصفات التنظيمية الحديثة.",
      ],
  }
  return pd.DataFrame(data)


df_pesticides = load_pesticides_data()

# إعداد قارئ EasyOCR مع التخزين المؤقت لتسريع الأداء
@st.cache_resource
def load_ocr_reader():
  if HAS_EASYOCR:
    try:
      return easyocr.Reader(["en", "ar"], gpu=False)
    except Exception:
      return None
  return None


ocr_reader = load_ocr_reader()

# واجهة التطبيق الجانبية
st.sidebar.title("🛡️ المستشار الزراعي")
st.sidebar.markdown("---")
app_mode = st.sidebar.selectbox(
    "اختر وضع الاستخدام:",
    [
        "🔍 البحث اليدوي والتحقق",
        "📷 التعرف البصري بالذكاء الاصطناعي (OCR)",
        "🚜 إرشادات المزارعين",
        "⚖️ تقارير اللجان الفنية والضبط القضائي",
    ],
)

# 1. قسم البحث اليدوي والتحقق
if app_mode == "🔍 البحث اليدوي والتحقق":
  st.header("🔍 البحث السريع في المواد الفعالة والقرارات التنظيمية")

  search_query = st.text_input(
      "أدخل اسم المادة الفعالة أو جزءاً منها (بالعربية أو الإنجليزية):"
  )

  if search_query:
    filtered_df = df_pesticides[
        df_pesticides.apply(
            lambda row: row.astype(str)
            .str.contains(search_query, case=False, na=False)
            .any(),
            axis=1,
        )
    ]

    if not filtered_df.empty:
      st.success(f"تم العثور على {len.filtered_df if 'len' in globals() else len(filtered_df)} نتيجة مطابقة:")
      for idx, row in filtered_df.iterrows():
        st.markdown(
            f"### 🧪 المادة الفعالة: {row.get('المادة الفعالة (Active Substance)', 'غير محدد')}"
        )
        st.info(
            f"**الحالة التنظيمية:** {row.get('الحالة', 'غير متوفر')} | **اللون الإرشادي:** {row.get('اللون الإرشادي', 'غير متوفر')}"
        )
        st.write(
            f"**التفصيل والقرار:** {row.get('التفصيل والقرار', 'لا توجد تفاصيل إضافية.')}"
        )
        st.markdown("---")
    else:
      st.warning(
          "لم يتم العثور على نتائج مطابقة في القوائم المعتمدة الحالية. تأكد من صحة الاسم أو جرب البحث بمقطع آخر."
      )
  else:
    st.info(
        "الرجاء إدخال اسم المادة الفعالة في حقل البحث أعلاه للاستعلام عن حالتها والقرارات الصادرة بشأنها."
    )

# 2. قسم التعرف البصري الذكي (OCR)
elif app_mode == "📷 التعرف البصري بالذكاء الاصطناعي (OCR)":
  st.header("📷 فحص لصقة المبيد بالذكاء الاصطناعي")
  st.write(
      "قم برفع صورة واضحة لبطاقة أو لصقة العبوة لاستخراج النصوص وتحليل المواد الفعالة تلقائياً."
  )

  uploaded_file = st.file_uploader(
      "اختر صورة (JPG, PNG)", type=["jpg", "jpeg", "png"]
  )

  if uploaded_file is not None:
    image = Image.open(uploaded_file)
    st.image(image, caption="الصورة المرفوعة", use_column_width=True)

    if st.button("بدء تحليل واستخراج النص"):
      if not HAS_EASYOCR or ocr_reader is None:
        st.error(
            "مكتبة التعرف البصري EasyOCR غير محملة أو غير متاحة في البيئة الحالية."
        )
      else:
        with st.spinner(
            "جاري معالجة الصورة وتحسين التباين واستخراج النصوص..."
        ):
          # تحويل الصورة إلى مصفوفة OpenCV ومعالجة التباين
          img_array = np.array(image)
          gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
          # تحسين التباين باستخدام CLAHE
          clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
          enhanced = clahe.apply(gray)

          # قراءة النصوص
          results = ocr_reader.readtext(enhanced)
          extracted_text = " ".join([res[1] for res in results])

          st.subheader("النصوص المستخرجة من اللصقة:")
          st.code(extracted_text, language="text")

          # البحث التلقائي عن المواد داخل النصوص المستخرجة
          found_matches = []
          for idx, row in df_pesticides.iterrows():
            substance = str(
                row.get("المادة الفعالة (Active Substance)", "")
            ).lower()
            if substance and substance in extracted_text.lower():
              found_matches.append(row)

          if found_matches:
            st.success("🎯 تم رصد المواد الفعالة التالية في النص المستخرج:")
            for match in found_matches:
              st.markdown(
                  f"**المادة:** {match.get('المادة الفعالة (Active Substance)')} | **الحالة:** {match.get('الحالة')} | **اللون:** {match.get('اللون الإرشادي')}"
              )
              st.write(f"**التفصيل:** {match.get('التفصيل والقرار')}")
          else:
            st.warning(
                "لم يتم مطابقة أي مادة فعالة مسجلة مع النص المستخرج بشكل مباشر. يرجى مراجعة الصورة أو استخدام البحث اليدوي."
            )

# 3. قسم إرشادات المزارعين
elif app_mode == "🚜 إرشادات المزارعين":
  st.header("🚜 الدليل الإرشادي الميداني للمزارعين")
  st.markdown(
      """
  * **شروط السلامة الشخصية:** ارتداء الأقنعة واقية والقفازات والملابس ذات الأكمام الطويلة عند الرش.
  * **أوقات الرش المثلى:** يفضل الرش في الصباح الباكر أو قبيل الغروب لتجنب ارتفاع درجات الحرارة وسرعة تبخر المبيد.
  * **فترة الأمان (PHI):** الالتزام التام بالمدة الزمنية الفاصلة بين آخر رشة وموعد جني المحصول لضمان خلو الثمار من المتبقيات الضارة.
  * **التخلص الآمن من العبوات:** عدم إعادة استخدام عبوات المبيدات الفارغة في حفظ الأغذية أو المياه، والتخلص منها بالطرق الآمنة بيئياً.
  """
  )

# 4. قسم تقارير اللجان الفنية والضبط القضائي
elif app_mode == "⚖️ تقارير اللجان الفنية والضبط القضائي":
  st.header("⚖️ منظومة تقارير الضبط الفني وإثبات الحالة")
  st.write(
      "إعداد وتصدير تقارير رسمية معتمدة للجان التفتيش والخبرة القضائية بصيغة PDF."
  )

  with st.form("report_form"):
    col1, col2 = st.columns(2)
    with col1:
      inspector_name = st.text_input("اسم الخبير / المحقق:")
      location = st.text_input("موقع المعاينة / المحل:")
    with col2:
      date_val = st.date_input("تاريخ المعاينة:", datetime.now())
      violation_type = st.selectbox(
          "نوع المخالفة / الملاحظة:",
          [
              "تداول مبيدات محظورة",
              "انتهاء صلاحية المبيدات",
              "عرض بدون ترخيص",
              "مخالفة شروط التخزين",
              "أخرى",
          ],
      )

    notes = st.text_area("تفاصيل وملاحظات اللجنة الفنية:")
    submit_btn = st.form_submit_button("إنشاء التقرير الرسمي")

    if submit_btn:
      if not HAS_FPDF:
        st.error(
            "مكتبة توليد ملفات الـ PDF (FPDF) غير متوفرة في البيئة الحالية."
        )
      else:
        st.success("تم إعداد بيانات التقرير بنجاح وقريباً يتم دعمه بالتصدير الفوري!")
        st.markdown(
            f"**ملخص التقرير:** المحقق ({inspector_name}) - الموقع ({location}) - التاريخ ({date_val}) - المخالفة ({violation_type})"
        )