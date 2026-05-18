import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';

// ============= EXPORTED CONSTANTS =============
export const FORMATIVE_COLUMNS = ['F1A', 'F1B', 'F1C', 'F2A', 'F2B', 'F2C', 'F3A', 'F3B', 'F3C'];
export const SUMMATIVE_COLUMNS = ['SE1', 'SE2', 'SE3'];
export const CLASS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export const LPCD_FIELDS = [
  'Patterns of Intelligence',
  'Area of Interest',
  'Positive Attitude',
  'Exceptional Ability',
  'Features of Anxiety',
  'Learning Gaps',
  'Specific Learning Difficulties'
];

export const BCO_FIELDS = [
  'Self Awareness',
  'Communication Skill',
  'Collaborative Thinking',
  'Experiential Learning',
  'Critical Thinking',
  'Analytical Thinking',
  'Problem Solving',
  'Decision Making',
  'Creative Presentation',
  'Aesthetic Appreciation'
];

export const DPLS_FIELDS = [
  'Listening Skill',
  'Communication',
  'Empathy',
  'Cooperation',
  'Conversation',
  'Friendship',
  'Conflict Resolution',
  'Stress Management',
  'Decision Making',
  'Leadership'
];

// ============= API KEY MANAGEMENT =============
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
  const subjects = ['1st Language', '2nd Language', 'Mathematics', 'Our Environmental', 'Art & Work Education', 'Health & Physical Education'];
  const marks = {};
  subjects.forEach(s => {
    marks[s] = {};
    [...FORMATIVE_COLUMNS, ...SUMMATIVE_COLUMNS].forEach(c => marks[s][c] = '');
  });

  const lpcd = {};
  LPCD_FIELDS.forEach(f => lpcd[f] = { phase1: '', phase2: '', phase3: '' });

  const bco = {};
  BCO_FIELDS.forEach(f => bco[f] = { phase1: '', phase2: '', phase3: '' });

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
  const allSubjects = ['1st Language', '2nd Language', 'Mathematics', 'Our Environmental', 'Art & Work Education', 'Health & Physical Education'];
  
  // Subject mapping for API response (Our Environment -> Our Environmental)
  const subjectMapping = {
    'Our Environment': 'Our Environmental',
    'Our Environmental': 'Our Environmental'
  };
  
  const formative = {};
  const summative = {};

  allSubjects.forEach((subject) => {
    formative[subject] = {};
    summative[subject] = {};
    
    // Check if subject exists in student.marks with mapping
    let marksData = {};
    for (const [key, value] of Object.entries(student.marks || {})) {
      const mappedKey = subjectMapping[key] || key;
      if (mappedKey === subject) {
        marksData = value;
        break;
      }
    }
    
    // Also check direct match
    if (Object.keys(marksData).length === 0 && student.marks?.[subject]) {
      marksData = student.marks[subject];
    }

    FORMATIVE_COLUMNS.forEach((col) => {
      const val = marksData[col];
      formative[subject][col] = (val === null || val === undefined) ? '' : String(val);
    });
    SUMMATIVE_COLUMNS.forEach((col) => {
      const val = marksData[col];
      summative[subject][col] = (val === null || val === undefined) ? '' : String(val);
    });
  });

  const lpcd = {};
  LPCD_FIELDS.forEach(field => {
    const raw = student.lpcd?.[field] || {};
    lpcd[field] = {
      phase1: raw.phase1 || raw.formative1 || '',
      phase2: raw.phase2 || raw.formative2 || '',
      phase3: raw.phase3 || raw.formative3 || ''
    };
  });

  const bco = {};
  BCO_FIELDS.forEach(field => {
    const raw = student.bco?.[field] || {};
    bco[field] = {
      phase1: raw.phase1 || raw.formative1 || '',
      phase2: raw.phase2 || raw.formative2 || '',
      phase3: raw.phase3 || raw.formative3 || ''
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
    subjects: allSubjects
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

    const prompt = `You are an OCR system. Extract ALL data from this Holistic Progress Report Card.

Return ONLY valid JSON with this exact structure:

{
  "name": "student full name",
  "class": "I/II/III/IV/V",
  "roll": "01",
  "section": "A/B/C/D",
  "marks": {
    "1st Language": {"F1A": "", "F1B": "", "F1C": "", "SE1": ""},
    "2nd Language": {"F1A": "", "F1B": "", "F1C": "", "SE1": ""},
    "Mathematics": {"F1A": "", "F1B": "", "F1C": "", "SE1": ""},
    "Our Environmental": {"F1A": "", "F1B": "", "F1C": "", "SE1": ""},
    "Art & Work Education": {"F1A": "", "F1B": "", "F1C": "", "SE1": ""},
    "Health & Physical Education": {"F1A": "", "F1B": "", "F1C": "", "SE1": ""}
  },
  "lpcd": {
    "Patterns of Intelligence": {"phase1": "", "phase2": "", "phase3": ""},
    "Area of Interest": {"phase1": "", "phase2": "", "phase3": ""},
    "Positive Attitude": {"phase1": "", "phase2": "", "phase3": ""},
    "Exceptional Ability": {"phase1": "", "phase2": "", "phase3": ""},
    "Features of Anxiety": {"phase1": "", "phase2": "", "phase3": ""},
    "Learning Gaps": {"phase1": "", "phase2": "", "phase3": ""},
    "Specific Learning Difficulties": {"phase1": "", "phase2": "", "phase3": ""}
  },
  "bco": {
    "Self Awareness": {"phase1": "", "phase2": "", "phase3": ""},
    "Communication Skill": {"phase1": "", "phase2": "", "phase3": ""},
    "Collaborative Thinking": {"phase1": "", "phase2": "", "phase3": ""},
    "Experiential Learning": {"phase1": "", "phase2": "", "phase3": ""},
    "Critical Thinking": {"phase1": "", "phase2": "", "phase3": ""},
    "Analytical Thinking": {"phase1": "", "phase2": "", "phase3": ""},
    "Problem Solving": {"phase1": "", "phase2": "", "phase3": ""},
    "Decision Making": {"phase1": "", "phase2": "", "phase3": ""},
    "Creative Presentation": {"phase1": "", "phase2": "", "phase3": ""},
    "Aesthetic Appreciation": {"phase1": "", "phase2": "", "phase3": ""}
  },
  "dpls": {
    "Listening Skill": {"remark": ""},
    "Communication": {"remark": ""},
    "Empathy": {"remark": ""},
    "Cooperation": {"remark": ""},
    "Conversation": {"remark": ""},
    "Friendship": {"remark": ""},
    "Conflict Resolution": {"remark": ""},
    "Stress Management": {"remark": ""},
    "Decision Making": {"remark": ""},
    "Leadership": {"remark": ""}
  }
}

EXTRACTION RULES:
1. LPCD fields: Extract short keywords or grades (Good, Average, Poor OR A/B/C/D)
2. BCO fields: Extract grades (A, B, C, D)
3. DPLS fields: Extract teacher remarks
4. If a field has no data, use empty string ""
5. Subject name is "Our Environmental" (not "Our Environment")
6. Return ONLY valid JSON, no markdown`;

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
        console.log("📊 Subjects found:", Object.keys(extractedData.marks || {}));
        console.log("📊 LPCD fields found:", Object.keys(extractedData.lpcd || {}));
        console.log("📊 BCO fields found:", Object.keys(extractedData.bco || {}));
        console.log("📊 DPLS fields found:", Object.keys(extractedData.dpls || {}));
      }
    } catch (parseError) {
      console.log("❌ JSON Parse Error:", parseError.message);
      extractedData = {};
    }

    const defaultStudent = createEmptyStudent();

    let finalClass = extractedData.class || '';
    if (finalClass && !finalClass.match(/^[IVXLCDM]+$/i)) {
      const classMap = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V' };
      finalClass = classMap[finalClass] || finalClass;
    }

    // Merge marks data with subject mapping
    const mergedMarks = { ...defaultStudent.marks };
    if (extractedData.marks) {
      Object.keys(extractedData.marks).forEach(subject => {
        let mappedSubject = subject;
        if (subject === 'Our Environment') mappedSubject = 'Our Environmental';
        if (mergedMarks[mappedSubject]) {
          mergedMarks[mappedSubject] = { ...mergedMarks[mappedSubject], ...extractedData.marks[subject] };
        } else {
          mergedMarks[mappedSubject] = extractedData.marks[subject];
        }
      });
    }

    // Merge LPCD data
    const mergedLPCD = { ...defaultStudent.lpcd, ...(extractedData.lpcd || {}) };
    
    // Merge BCO data
    const mergedBCO = { ...defaultStudent.bco, ...(extractedData.bco || {}) };
    
    // Merge DPLS data
    const mergedDPLS = { ...defaultStudent.dpls, ...(extractedData.dpls || {}) };

    console.log("🔴 FINAL MARKS - Subjects:", Object.keys(mergedMarks));
    console.log("🔴 FINAL LPCD - Fields:", Object.keys(mergedLPCD));
    console.log("🔴 FINAL BCO - Fields:", Object.keys(mergedBCO));
    console.log("🔴 FINAL DPLS - Fields:", Object.keys(mergedDPLS));

    return {
      ...defaultStudent,
      name: extractedData.name || '',
      class: cleanClassName(finalClass),
      roll: cleanRollNumber(extractedData.roll || ''),
      section: extractedData.section || '',
      marks: mergedMarks,
      lpcd: mergedLPCD,
      bco: mergedBCO,
      dpls: mergedDPLS,
    };

  } catch (error) {
    console.log("❌ OCR Error:", error.message);
    Alert.alert("Error", "Failed to process image: " + error.message);
    return createEmptyStudent();
  }
}