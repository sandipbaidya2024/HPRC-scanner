import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';

export const FORMATIVE_COLUMNS = ['F1A', 'F1B', 'F1C', 'F2A', 'F2B', 'F2C', 'F3A', 'F3B', 'F3C'];
export const SUMMATIVE_COLUMNS = ['SE1', 'SE2', 'SE3'];
export const MARK_COLUMNS = [...FORMATIVE_COLUMNS, ...SUMMATIVE_COLUMNS];
export const CLASS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export const GRADE_OPTIONS = ['A', 'B', 'C', 'D'];
export const PHASE_COLUMNS = [
  { key: 'formative1', label: 'Formative 1st Phase' },
  { key: 'formative2', label: 'Formative 2nd Phase' },
  { key: 'formative3', label: 'Formative 3rd Phase' },
];

export const LPCD_FIELDS = ['Pattern of intelligence', 'Area of interest', 'Positive attitude', 'Exceptional ability', 'Features of anxiety', 'Learning gaps', 'Specific learning difficulties'];
export const BCO_FIELDS = ['Self awareness', 'Communication skill', 'Collaborative thinking', 'Experiential learning skill', 'Critical thinking', 'Computational / Analytical thinking', 'Problem solving ability', 'Decision making skills', 'Creative presentation skill', 'Aesthetic appreciation'];

// ============= MULTI-KEY MANAGEMENT SYSTEM =============
const API_KEYS = [
  process.env.EXPO_PUBLIC_GEMINI_API_KEY_1,
  process.env.EXPO_PUBLIC_GEMINI_API_KEY_2,
  process.env.EXPO_PUBLIC_GEMINI_API_KEY_3,
  process.env.EXPO_PUBLIC_GEMINI_API_KEY_4,
  process.env.EXPO_PUBLIC_GEMINI_API_KEY_5,
].filter(key => key && key.length > 20);

let currentKeyIndex = 0;
let keyUsageCount = new Map();

function getNextApiKey() {
  if (API_KEYS.length === 0) {
    console.error("❌ No valid API Keys found!");
    return null;
  }
  
  const key = API_KEYS[currentKeyIndex];
  const count = (keyUsageCount.get(key) || 0) + 1;
  keyUsageCount.set(key, count);
  
  console.log(`🔄 Using Key ${currentKeyIndex + 1}/${API_KEYS.length} (Used ${count} times today)`);
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  
  return key;
}

// ============= HELPER FUNCTIONS =============
function cleanRollNumber(roll) {
  if (!roll) return '';
  // শুধু সংখ্যা রাখুন (০১ থেকে ১০০ ফরম্যাটে)
  const cleaned = roll.toString().replace(/[^0-9]/g, '');
  // ২ ডিজিটে ফরম্যাট করুন (০১, ০২, ..., ১০০)
  if (cleaned && cleaned.length === 1) {
    return `0${cleaned}`;
  }
  return cleaned;
}

function cleanClassName(className) {
  if (!className) return '';
  // রোমান সংখ্যা বড় হাতের অক্ষরে কনভার্ট (i, ii, iii -> I, II, III)
  const romanMap = {
    'i': 'I', 'ii': 'II', 'iii': 'III', 'iv': 'IV', 'v': 'V',
    'vi': 'VI', 'vii': 'VII', 'viii': 'VIII', 'ix': 'IX', 'x': 'X'
  };
  const lower = className.toLowerCase().trim();
  return romanMap[lower] || className.toUpperCase();
}

function createMarksForClass(subjectsList) {
  const marksObject = {};
  subjectsList.forEach((subject) => {
    marksObject[subject] = {};
    MARK_COLUMNS.forEach((column) => { marksObject[subject][column] = ''; });
  });
  return marksObject;
}

function createLPCDSection() {
  const lpcdObject = {};
  LPCD_FIELDS.forEach((field) => {
    lpcdObject[field] = {};
    PHASE_COLUMNS.forEach((phase) => { lpcdObject[field][phase.key] = ''; });
  });
  return lpcdObject;
}

function createBCOSection() {
  const bcoObject = {};
  BCO_FIELDS.forEach((field) => {
    bcoObject[field] = {};
    PHASE_COLUMNS.forEach((phase) => { bcoObject[field][phase.key] = ''; });
  });
  return bcoObject;
}

export function createEmptyStudent(subjectsList = ['1st Language', '2nd Language', 'Mathematics', 'Our Environment', 'Art & Work Education', 'Health & Physical Education']) {
  return { 
    imageUri: '', 
    ocrText: '', 
    name: '', 
    class: '', 
    roll: '', 
    section: '', 
    subjects: subjectsList, 
    marks: createMarksForClass(subjectsList), 
    lpcd: createLPCDSection(), 
    bco: createBCOSection() 
  };
}

// ============= MAIN OCR FUNCTION =============
export async function parseStudentFromImage(imageUri) {
  const cleanImageUri = imageUri.split('?')[0];

  try {
    const compressedImage = await manipulateAsync(
      cleanImageUri,
      [{ resize: { width: 1500 } }], 
      { compress: 0.6, format: SaveFormat.JPEG }
    );

    const base64Image = await FileSystem.readAsStringAsync(compressedImage.uri, {
      encoding: 'base64', 
    });

    const MODEL_NAME = "gemini-2.5-flash";
    const API_KEY = getNextApiKey();
    
    if (!API_KEY) {
      Alert.alert(
        "⚠️ No API Key", 
        "API key not configured. Please contact support.",
        [{ text: "OK" }]
      );
      return createEmptyStudent();
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [
          { text: `Extract student details from this report card. Return ONLY a pure JSON object...` }, 
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }]
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    // ✅ 429 Rate Limit Error
    if (response.status === 429) {
      console.log("⚠️ Rate limit hit");
      Alert.alert(
        "📵 লিমিট শেষ!",
        "আজকের বিনামূল্যে স্ক্যান লিমিট শেষ হয়ে গেছে।\n\n⏰ ১০ মিনিট পরে আবার চেষ্টা করুন।\n\n📌 টিপস: পরিষ্কার ছবি তুললে আরও ভালো রেজাল্ট পাওয়া যায়।",
        [{ text: "বুঝলাম" }]
      );
      return createEmptyStudent();
    }

    // ✅ 403 Forbidden (API Key issue)
    if (response.status === 403) {
      Alert.alert(
        "🔑 API সংযোগ সমস্যা",
        "সার্ভারের সাথে যোগাযোগ করতে পারছি না।\n\nএকটু পরে আবার চেষ্টা করুন।",
        [{ text: "ঠিক আছে" }]
      );
      return createEmptyStudent();
    }

    // ✅ 500+ Server Error
    if (response.status >= 500) {
      Alert.alert(
        "🔄 সার্ভার সমস্যা",
        "সার্ভার এখন ব্যস্ত। দয়া করে ২-৩ মিনিট পরে আবার চেষ্টা করুন।",
        [{ text: "ঠিক আছে" }]
      );
      return createEmptyStudent();
    }

    // ✅ Other HTTP Errors
    if (!response.ok) {
      Alert.alert(
        "❌ স্ক্যান ব্যর্থ",
        `ছবিটি সঠিকভাবে পড়া যায়নি। (Error: ${response.status})\n\n📌 দয়া করে:\n• ভালো আলোতে ছবি তুলুন\n• ছবি পরিষ্কার রাখুন\n• আবার চেষ্টা করুন`,
        [{ text: "ঠিক আছে" }]
      );
      return createEmptyStudent();
    }

    const data = JSON.parse(responseText);

    if (!data.candidates || data.candidates.length === 0) {
      Alert.alert(
        "🔍 কিছু পাওয়া যায়নি",
        "এই ছবি থেকে কোনো তথ্য বের করা সম্ভব হয়নি।\n\n📌 দয়া করে:\n• ছবিটি ভালো করে তুলুন\n• রিপোর্ট কার্ডটি সোজা রাখুন\n• আবার চেষ্টা করুন",
        [{ text: "ঠিক আছে" }]
      );
      return createEmptyStudent();
    }

    let rawText = data.candidates[0].content.parts[0].text;
    
    console.log("\n====================================");
    console.log("🤖 GEMINI RAW RESPONSE:");
    console.log(rawText);
    console.log("====================================\n");

    let extractedData = {};
    try {
        const startIndex = rawText.indexOf('{');
        const endIndex = rawText.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            const jsonString = rawText.substring(startIndex, endIndex + 1);
            extractedData = JSON.parse(jsonString);
        } else {
            extractedData = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
        }
        
        if (extractedData.roll) {
            extractedData.roll = cleanRollNumber(extractedData.roll);
        }
        
        if (extractedData.class) {
            extractedData.class = cleanClassName(extractedData.class);
        }
        
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        Alert.alert(
          "⚠️ ডাটা ফরম্যাট সমস্যা",
          "ছবি থেকে তথ্য বের করা গেলেও ফরম্যাট ঠিক নেই।\n\nদয়া করে ম্যানুয়ালি তথ্য দিন।",
          [{ text: "ঠিক আছে" }]
        );
        return createEmptyStudent();
    }

    const defaultStudent = createEmptyStudent();
    return {
      ...defaultStudent,
      imageUri: cleanImageUri,
      name: extractedData.name || '',
      class: extractedData.class || '',
      roll: extractedData.roll || '',
      section: extractedData.section || '',
      marks: { ...defaultStudent.marks, ...extractedData.marks },
      lpcd: { ...defaultStudent.lpcd, ...extractedData.lpcd },
      bco: { ...defaultStudent.bco, ...extractedData.bco },
    };

  } catch (error) {
    console.error("Fetch/App Error:", error);
    
    // ✅ Network Error
    if (error.message === 'Network request failed') {
      Alert.alert(
        "📡 নেটওয়ার্ক সমস্যা",
        "ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন।",
        [{ text: "ঠিক আছে" }]
      );
    } else {
      Alert.alert(
        "⚠️ অজানা ত্রুটি",
        `কিছু একটা সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।\n\n${error.message}`,
        [{ text: "ঠিক আছে" }]
      );
    }
    return createEmptyStudent();
  }
}

export function toEditDataStudent(student) {
  const subjects = student.subjects || ['1st Language', '2nd Language', 'Mathematics', 'Our Environment', 'Art & Work Education', 'Health & Physical Education'];
  const formative = {};
  const summative = {};
  
  subjects.forEach((subject) => {
    formative[subject] = {};
    summative[subject] = {};
    const subjectMarks = student.marks?.[subject] || {};
    FORMATIVE_COLUMNS.forEach((column) => { formative[subject][column] = subjectMarks[column] || ''; });
    SUMMATIVE_COLUMNS.forEach((column) => { summative[subject][column] = subjectMarks[column] || ''; });
  });
  
  return { 
      id: student.id || Date.now(), 
      name: student.name || '', 
      class: student.class || '', 
      roll: student.roll || '', 
      section: student.section || '', 
      formative, 
      summative, 
      lpcd: student.lpcd || createLPCDSection(), 
      bco: student.bco || createBCOSection() 
  };
}

export function buildStructuredStudent(student) { 
    return toEditDataStudent(student); 
}

export function updateStudentClass(student, className) { 
    return { ...student, class: className }; 
}