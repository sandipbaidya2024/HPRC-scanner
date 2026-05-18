import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';

// ============= EXPORTED CONSTANTS =============
export const FORMATIVE_COLUMNS = ['F1A', 'F1B', 'F1C', 'F2A', 'F2B', 'F2C', 'F3A', 'F3B', 'F3C'];
export const SUMMATIVE_COLUMNS = ['SE1', 'SE2', 'SE3'];
export const CLASS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export const LPCD_FIELDS = [
  'Pattern of intelligence', 'Area of interest', 'Positive attitude',
  'Exceptional ability', 'Features of anxiety', 'Learning gaps',
  'Specific learning difficulties'
];

export const BCO_FIELDS = [
  'Self awareness', 'Communication skill', 'Collaborative thinking',
  'Experiential learning skill', 'Critical thinking',
  'Computational / Analytical thinking', 'Problem solving ability',
  'Decision making skills', 'Creative presentation skill', 'Aesthetic appreciation'
];

export const DPLS_FIELDS = [
  'Listening Skill', 'Communication', 'Empathy Skill', 'Co-operation Skill',
  'Conversation Skill', 'Friendship Skill', 'Conflict Resolution',
  'Stress Coping Skill', 'Decision Making', 'Leadership'
];

// ============= API KEY MANAGEMENT (5 Keys) =============
// ============= API KEY MANAGEMENT (Paid API - Single Key) =============
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

function getNextApiKey() {
  if (!API_KEY || API_KEY.length < 20) {
    console.error("❌ No valid API Key found! Please check .env file");
    return null;
  }
  console.log("🔑 Using Paid API Key");
  return API_KEY;
}
function cleanClassName(className) {
  if (!className) return '';
  const romanMap = {
    'i': 'I', 'ii': 'II', 'iii': 'III', 'iv': 'IV', 'v': 'V',
    'vi': 'VI', 'vii': 'VII', 'viii': 'VIII', 'ix': 'IX', 'x': 'X',
    '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V'
  };
  const lower = className.toLowerCase().trim();
  return romanMap[lower] || className.toUpperCase();
}

function cleanRollNumber(roll) {
  if (!roll) return '';
  const cleaned = roll.toString().replace(/[^0-9]/g, '');
  if (cleaned && cleaned.length === 1) return `0${cleaned}`;
  return cleaned;
}

// ============= CREATE EMPTY STUDENT =============
export function createEmptyStudent() {
  const subjects = ['1st Language', '2nd Language', 'Mathematics', 'Our Environment', 'Art & Work Education', 'Health & Physical Education'];
  const marks = {};
  subjects.forEach(s => {
    marks[s] = {};
    [...FORMATIVE_COLUMNS, ...SUMMATIVE_COLUMNS].forEach(c => marks[s][c] = '');
  });

  const lpcd = {};
  LPCD_FIELDS.forEach(f => lpcd[f] = { formative1: '', formative2: '', formative3: '' });

  const bco = {};
  BCO_FIELDS.forEach(f => bco[f] = { formative1: '', formative2: '', formative3: '' });

  const dpls = {};
  DPLS_FIELDS.forEach(f => dpls[f] = { remark: '' });

  return {
    imageUri: '',
    name: '',
    class: '',
    roll: '',
    section: '',
    marks,
    lpcd,
    bco,
    dpls,
    subjects
  };
}

// ============= CONVERT TO EDIT DATA FORMAT =============
export function toEditDataStudent(student) {
  const subjects = student.subjects || ['1st Language', '2nd Language', 'Mathematics', 'Our Environment', 'Art & Work Education', 'Health & Physical Education'];
  const formative = {};
  const summative = {};

  subjects.forEach((subject) => {
    formative[subject] = {};
    summative[subject] = {};
    const sm = student.marks?.[subject] || {};

    FORMATIVE_COLUMNS.forEach((col) => {
      const val = sm[col];
      formative[subject][col] = (val === null || val === undefined) ? '' : String(val);
    });
    SUMMATIVE_COLUMNS.forEach((col) => {
      const val = sm[col];
      summative[subject][col] = (val === null || val === undefined) ? '' : String(val);
    });
  });

  const lpcd = {};
  LPCD_FIELDS.forEach(field => {
    const raw = student.lpcd?.[field] || {};
    lpcd[field] = {
      formative1: raw.formative1 || raw.F1 || '',
      formative2: raw.formative2 || raw.F2 || '',
      formative3: raw.formative3 || raw.F3 || ''
    };
  });

  const bco = {};
  BCO_FIELDS.forEach(field => {
    const raw = student.bco?.[field] || {};
    bco[field] = {
      formative1: raw.formative1 || raw.F1 || '',
      formative2: raw.formative2 || raw.F2 || '',
      formative3: raw.formative3 || raw.F3 || ''
    };
  });

  const dpls = {};
  DPLS_FIELDS.forEach(field => {
    const raw = student.dpls?.[field] || {};
    dpls[field] = { remark: raw.remark || raw || '' };
  });

  return {
    id: student.id || Date.now(),
    name: student.name || '',
    class: student.class || '',
    roll: student.roll || '',
    section: student.section || '',
    formative,
    summative,
    lpcd,
    bco,
    dpls,
    subjects
  };
}

// ============= MAIN OCR FUNCTION =============
export async function parseStudentFromImage(imageUri, base64Image = null) {
  try {
    console.log("🚀 Starting OCR parse...");
    
    let finalBase64 = base64Image;
    
    if (!finalBase64) {
      const cleanUri = imageUri.split('?')[0];
      const fileUri = cleanUri.startsWith('file://') ? cleanUri : 'file://' + cleanUri;
      
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log(`📊 Original Size: ${(fileInfo.size / 1024).toFixed(0)} KB`);
      
      const optimized = await manipulateAsync(
        fileUri,
        [{ resize: { width: 1000 } }],
        { compress: 0.5, format: SaveFormat.JPEG }
      );
      
      finalBase64 = await FileSystem.readAsStringAsync(optimized.uri, {
        encoding: 'base64',
      });
    }
    
    if (!finalBase64 || finalBase64.length < 100) {
      Alert.alert("Error", "No valid image data received");
      return createEmptyStudent();
    }

    const API_KEY = getNextApiKey();
    if (!API_KEY) {
      Alert.alert("Error", "API Key not found");
      return createEmptyStudent();
    }

    const MODEL_NAME = "gemini-2.5-flash";
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    // Improved prompt with explicit instructions
    const prompt = `You are an OCR system for Banglar Shiksha report cards. Extract data from this image.

**CRITICAL RULES:**
1. Class MUST be Roman numeral: I, II, III, IV, V (NOT 1,2,3,4,5)
2. Roll number: 2-digit format (01, 02, 15 - NOT 1,2,15)
3. ALL 6 subjects must have marks extracted
4. "Health & Physical Education" marks are IMPORTANT - do not skip
5. SE1 marks are summative evaluation marks

**Return ONLY this JSON format (no markdown, no explanation):**
{
  "name": "full name from card",
  "class": "I or II or III or IV or V",
  "roll": "01 or 02 or 15",
  "section": "A or B or C or D",
  "marks": {
    "1st Language": {"F1A":"", "F1B":"", "F1C":"", "F2A":"", "F2B":"", "F2C":"", "F3A":"", "F3B":"", "F3C":"", "SE1":"", "SE2":"", "SE3":""},
    "2nd Language": {"F1A":"", "F1B":"", "F1C":"", "F2A":"", "F2B":"", "F2C":"", "F3A":"", "F3B":"", "F3C":"", "SE1":"", "SE2":"", "SE3":""},
    "Mathematics": {"F1A":"", "F1B":"", "F1C":"", "F2A":"", "F2B":"", "F2C":"", "F3A":"", "F3B":"", "F3C":"", "SE1":"", "SE2":"", "SE3":""},
    "Our Environment": {"F1A":"", "F1B":"", "F1C":"", "F2A":"", "F2B":"", "F2C":"", "F3A":"", "F3B":"", "F3C":"", "SE1":"", "SE2":"", "SE3":""},
    "Art & Work Education": {"F1A":"", "F1B":"", "F1C":"", "F2A":"", "F2B":"", "F2C":"", "F3A":"", "F3B":"", "F3C":"", "SE1":"", "SE2":"", "SE3":""},
    "Health & Physical Education": {"F1A":"", "F1B":"", "F1C":"", "F2A":"", "F2B":"", "F2C":"", "F3A":"", "F3B":"", "F3C":"", "SE1":"", "SE2":"", "SE3":""}
  },
  "lpcd": {},
  "bco": {},
  "dpls": {}
}

**REMEMBER:** 
- Class: convert "1" to "I", "2" to "II", "3" to "III", "4" to "IV", "5" to "V"
- If "Our Environmental" appears, rename to "Our Environment"
- Extract ALL visible marks, especially SE1 for all subjects
- Return ONLY valid JSON`;

    let response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: finalBase64 } }
          ]
        }]
      })
    });

    const responseText = await response.text();
    console.log("📡 Response status:", response.status);

    if (response.status === 429) {
      Alert.alert("Limit Exceeded", "API limit reached. Please try again later.");
      return createEmptyStudent();
    }
    
    if (response.status === 503) {
      Alert.alert("Server Busy", "Server is busy. Please try again in a few seconds.");
      return createEmptyStudent();
    }

    if (!response.ok) {
      Alert.alert("API Error", `Status: ${response.status}`);
      return createEmptyStudent();
    }

    const resJson = JSON.parse(responseText);
    let rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    console.log("📝 Response received");

    let extractedData = {};
    try {
      let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
        console.log("✅ JSON Parsed Successfully");
        console.log("📚 Class:", extractedData.class);
        console.log("📝 Name:", extractedData.name);
      }
    } catch (parseError) {
      console.log("❌ JSON Parse Error:", parseError.message);
      extractedData = {};
    }

    // Fix "Our Environment" spelling
    if (extractedData.marks) {
      if (extractedData.marks["Our Environmental"] && !extractedData.marks["Our Environment"]) {
        extractedData.marks["Our Environment"] = extractedData.marks["Our Environmental"];
        delete extractedData.marks["Our Environmental"];
      }
    }

    const defaultStudent = createEmptyStudent();

    // Ensure class is properly formatted
    let finalClass = extractedData.class || '';
    if (finalClass && !finalClass.match(/^[IVXLCDM]+$/i)) {
      const classMap = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V' };
      finalClass = classMap[finalClass] || finalClass;
    }

    return {
      ...defaultStudent,
      name: extractedData.name || '',
      class: cleanClassName(finalClass),
      roll: cleanRollNumber(extractedData.roll || ''),
      section: extractedData.section || '',
      marks: { ...defaultStudent.marks, ...(extractedData.marks || {}) },
      lpcd: extractedData.lpcd || {},
      bco: extractedData.bco || {},
      dpls: extractedData.dpls || {},
    };

  } catch (error) {
    console.log("❌ OCR Error:", error.message);
    Alert.alert("Error", "Failed to process image: " + error.message);
    return createEmptyStudent();
  }
}