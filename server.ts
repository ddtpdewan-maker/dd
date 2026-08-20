import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initializer for Gemini API client
const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Response schema definition for structured OCR and metadata extraction
const ocrExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    documentType: {
      type: Type.STRING,
      description: "نوع الكتاب: 'وارد' (Incoming) أو 'صادر' (Outgoing) أو 'مذكرة داخلية' أو 'أخرى'",
    },
    subject: {
      type: Type.STRING,
      description: 'الموضوع أو عنوان الكتاب الرسمي المكتوب في رأس أو متن الكتاب',
    },
    letterDate: {
      type: Type.STRING,
      description: 'تاريخ الكتاب الرسمي المطبوع (صيغة YYYY/MM/DD أو كما هو مكتوب)',
    },
    outgoingNumber: {
      type: Type.STRING,
      description: 'رقم الصادر أو رقم الإشارة / رقم الكتاب الرسمي المطبوع',
    },
    incomingNumber: {
      type: Type.STRING,
      description: 'رقم الوارد العام (المكتوب يدوياً أو المطبوع)',
    },
    senderEntity: {
      type: Type.STRING,
      description: 'الجهة الصادر منها الكتاب (المرسل)',
    },
    recipientEntity: {
      type: Type.STRING,
      description: 'الجهة الموجه إليها الكتاب (المرسل إليه / إلى السيد)',
    },
    priority: {
      type: Type.STRING,
      description: "درجة الأهمية أو السرية: 'عادي' أو 'عاجل' أو 'عاجل جداً' أو 'سري' أو 'سري للغاية' أو 'هام للمتابعة'",
    },
    category: {
      type: Type.STRING,
      description: "التصنيف الإداري (إداري، مالي، قانوني، تعاميم، قرارات، مناقصات، توظيف، شؤون فنية، أخرى)",
    },
    blueStampDetected: {
      type: Type.BOOLEAN,
      description: 'هل تم اكتشاف ختم باللون الأزرق (ختم الوارد / الاستلام الأزرق) في الصفحة؟',
    },
    blueStampDetails: {
      type: Type.OBJECT,
      properties: {
        detected: {
          type: Type.BOOLEAN,
          description: 'تأكيد وجود الختم الأزرق',
        },
        handwrittenIncomingNumber: {
          type: Type.STRING,
          description: 'رقم الوارد المكتوب بخط اليد داخل الختم الأزرق بدقة متناهية (مثل 1254/و أو 450)',
        },
        handwrittenReceiptDate: {
          type: Type.STRING,
          description: 'تاريخ الاستلام أو تاريخ الورود المكتوب بخط اليد داخل الختم الأزرق',
        },
        stampPrintedText: {
          type: Type.STRING,
          description: 'النص المطبوع في إطار الختم الأزرق (اسم الدائرة أو الرمز الرسمي)',
        },
        confidence: {
          type: Type.NUMBER,
          description: 'نسبة الثقة في قراءة الخط اليدوي للختم الأزرق من 0 إلى 100',
        },
        notes: {
          type: Type.STRING,
          description: 'ملاحظات على الختم والخط اليدوي (مثل: وضوح الحبر، وجود توقيع، الخ)',
        },
        boundingBox: {
          type: Type.OBJECT,
          properties: {
            topPercent: { type: Type.NUMBER, description: 'المسافة من الأعلى كنسبة مئوية 0-100' },
            leftPercent: { type: Type.NUMBER, description: 'المسافة من اليسار كنسبة مئوية 0-100' },
            widthPercent: { type: Type.NUMBER, description: 'عرض الختم كنسبة مئوية 0-100' },
            heightPercent: { type: Type.NUMBER, description: 'ارتفاع الختم كنسبة مئوية 0-100' },
          },
          required: ['topPercent', 'leftPercent', 'widthPercent', 'heightPercent'],
        },
      },
      required: ['detected', 'handwrittenIncomingNumber', 'handwrittenReceiptDate'],
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'أهم 5-10 كلمات مفتاحية مستخرجة من أول صفحتين لتمييز الكتاب والبحث السريع',
    },
    importantNumbers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: 'بيان الرقم (مثل: رقم القرار، مبلغ الميزانية، رقم المناقصة، رقم المادة القانونية، رقم الهاتف)',
          },
          value: {
            type: Type.STRING,
            description: 'القيمة الرقمية أو المرجعية',
          },
        },
        required: ['label', 'value'],
      },
      description: 'قائمة بالأرقام والمبالغ والتواريخ والمراجع المهمة المستخرجة من أول صفحتين',
    },
    followUpAssignees: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          entityName: {
            type: Type.STRING,
            description: 'اسم الجهة أو الإدارة أو الموظف المتابع / المعطوف عليه (نسخة منه إلى / المكلف بالمتابعة)',
          },
          assignedAction: {
            type: Type.STRING,
            description: 'الإجراء أو التوجيه المطلوب من المتابع (مثال: للمتابعة وإجراء اللازم، للتنفيذ، لإبداء الرأي، للاطلاع، لإعداد مذكرة)',
          },
          deadline: {
            type: Type.STRING,
            description: 'الموعد النهائي أو مدة الإنجاز المحددة للمتابعة إن ذكرت (مثال: خلال أسبوع، قبل تاريخ 2026/06/01)',
          },
          status: {
            type: Type.STRING,
            description: "حالة المتابعة: 'قيد المتابعة' أو 'مكتمل' أو 'عاجل'",
          },
        },
        required: ['entityName', 'assignedAction'],
      },
      description: 'قائمة السادة المتابعين والجهات المكلفة بالمتابعة والتنفيذ المستخرجة تلقائياً من الكتاب (نسخة منه إلى / للتفضل بالعلم والمتابعة / تأشيرات المتابعة)',
    },
    attachments: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'قائمة المرافقات والمرفقات المذكورة في الكتاب الرسمي (مثل: كشف حساب، دراسة جدوى، جدول كميات، محضر اجتماع)',
    },
    followUpNotes: {
      type: Type.STRING,
      description: 'توجيهات المتابعة والتأشيرات الرئاسية أو الملاحظات الخاصة بمسار المعاملة',
    },
    summary: {
      type: Type.STRING,
      description: 'ملخص موجز ودقيق لمضمون الكتاب الرسمي في 2-3 جمل واضحة باللغة العربية',
    },
    actionRequired: {
      type: Type.STRING,
      description: 'الإجراء المطلوب إن وجد (مثل: إعداد رد، للاطلاع والتعميم، تدقيق مالي، حفظ في الملف)',
    },
    extractedTextSnippet: {
      type: Type.STRING,
      description: 'مقتطف من النص الأصلي للكتاب لأول صفحتين',
    },
  },
  required: [
    'documentType',
    'subject',
    'letterDate',
    'outgoingNumber',
    'incomingNumber',
    'senderEntity',
    'recipientEntity',
    'priority',
    'category',
    'blueStampDetected',
    'keywords',
    'importantNumbers',
    'summary',
  ],
};

// API Endpoint for AI Document OCR & Blue Stamp Recognition
app.post('/api/ocr/analyze', async (req, res) => {
  try {
    const { images, pdfBase64, mimeType, fileName } = req.body;

    if ((!images || !images.length) && !pdfBase64) {
      return res.status(400).json({
        error: 'يرجى تقديم صور الصفحات أو ملف PDF لتحليله.',
      });
    }

    const ai = getGemini();

    const parts: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }> = [];

    // System prompt specifically addressing Arabic document archiving and blue stamp handwritten OCR
    const systemPrompt = `أنت خبير محترف ومسؤول أرشفة إلكترونية للكتب والوثائق الرسمية الصادرة والواردة باللغة العربية.
مهمتك تحليل صور المستند (التركيز بشكل رئيسي ومطلق على أول صفحتين فقط من الكتاب الرسمي) واستخراج المعلومات والبيانات بدقة فائقة:

المهام الإلزامية:
1. تحديد نوع الكتاب: كتاب وارد (Incoming) أو كتاب صادر (Outgoing) أو تعميم / قرار.
2. استخراج التاريخ الرسمي للكتاب ورقم الصادر / الإشارة.
3. استخراج الجهة الصادرة والجهة الموجه إليها، وموضوع الكتاب بدقة ووضوح.
4. البحث بعناية شديدة عن "الختم الأزرق" (ختم الوارد / الاستلام الأزرق):
   - في الكتب الواردة، يوجد عادة ختم حبري باللون الأزرق (شكل مستطيل أو بيضاوي أو دائري).
   - بداخل هذا الختم الأزرق، يقوم الموظف بكتابة "رقم الوارد" و "تاريخ الاستلام" بخط اليد.
   - استخدم تقنية التعرف الضوئي على الخط اليدوي (Handwritten OCR) لقراءة الأرقام والتاريخ المكتوبة يدوياً داخل الختم الأزرق بدقة تامة.
   - حدد مكان الختم الأزرق التقريبي (boundingBox) كنسب مئوية من حجم الصفحة.
5. استخراج الكلمات المفتاحية الرئيسية (Keywords) التي تميز هذا الكتاب لتمكين البحث السريع والذكي.
6. استخراج الأرقام المهمة (أرقام قرارات، مواد قانونية، مبالغ مالية، نسب، أرقام ملفات أو حسابات).
7. استخراج قائمة "المتابعين والمكلفين بالإجراء" (نسخة منه إلى / للتفضل بالعلم والمتابعة والتنفيذ / السادة المتابعين):
   - حدد كل جهة أو شخص متابع، والتوجيه أو الإجراء المكلف به (للمتابعة، للتنفيذ، لإبداء الرأي، للاطلاع، إلخ)، والموعد النهائي إن وجد.
8. استخراج قائمة "المرافقات والمرفقات" (المرفقات المذكورة في الكتاب مثل: كشوفات، محاضر، تقارير).
9. كتابة ملخص تنفيذي موجز ومهني لمضمون الكتاب في جملتين أو ثلاث.
10. تحديد درجة الأهمية / السرية (عادي، عاجل، سري، إلخ) والإجراء المقترح العام.

تنبيه: التزم بتحليل أول صفحتين فقط، وأرجع البيانات بتنسيق JSON مطابق للمخطط المطلوب.`;

    parts.push({ text: systemPrompt });

    // Add image parts (up to first 2 pages)
    if (images && Array.isArray(images) && images.length > 0) {
      const targetPages = images.slice(0, 2); // restrict to first 2 pages
      for (let i = 0; i < targetPages.length; i++) {
        const img = targetPages[i];
        // Clean base64 string
        let base64Data = img;
        let imgMime = 'image/jpeg';
        if (typeof img === 'string' && img.startsWith('data:')) {
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            imgMime = match[1];
            base64Data = match[2];
          }
        }
        parts.push({
          inlineData: {
            mimeType: imgMime,
            data: base64Data,
          },
        });
      }
    } else if (pdfBase64) {
      let cleanPdf = pdfBase64;
      if (pdfBase64.startsWith('data:')) {
        const match = pdfBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          cleanPdf = match[2];
        }
      }
      parts.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: cleanPdf,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: ocrExtractionSchema,
        temperature: 0.1, // low temperature for accurate transcription and OCR
      },
    });

    const rawText = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch (e) {
      // Fallback extraction
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('فشل تفسير بيانات التحليل كـ JSON');
      }
    }

    return res.json({
      success: true,
      data: parsedResult,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('OCR analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء معالجة المستند والتعرف الضوئي',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(indexPath);

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
  } else {
    // If not in production or dist hasn't been built yet, use Vite middleware on the fly
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
