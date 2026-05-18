import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ সব STORAGE_KEYS এক জায়গায়
const STORAGE_KEYS = {
  STUDENTS_LIST: '@students_list',
  PROFILE_KEY: '@teacher_profile',
  APP_VERSION: '@app_version',
};

// ==================== STUDENT FUNCTIONS ====================

// ১. সমস্ত স্টুডেন্ট একসাথে আনা
export const getStudents = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS_LIST);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading students:', error);
    return [];
  }
};

export const checkStudentExists = async (roll, className) => {
  try {
    const allStudents = await getStudents();
    return allStudents.some(student =>
      String(student.roll) === String(roll) && student.class === className
    );
  } catch (error) {
    console.error('Error checking student:', error);
    return false;
  }
};

// ৩. স্টুডেন্ট সেভ বা আপডেট করা
// ৩. স্টুডেন্ট সেভ বা আপডেট করা
export const saveStudentData = async (studentData) => {
  try {
    const allStudents = await getStudents();
    const existingIndex = allStudents.findIndex(s => s.id === studentData.id);

    // ✅ নিশ্চিত করুন সব ডাটা সেভ হচ্ছে
    const studentToSave = {
      id: studentData.id || Date.now(),
      name: studentData.name || '',
      class: studentData.class || '',
      roll: studentData.roll || '',
      section: studentData.section || '',
      subjects: studentData.subjects || [],
      // ✅ মার্কস ডাটা সঠিকভাবে সেভ হচ্ছে কিনা
      marks: studentData.marks || {},
      formative: studentData.formative || {},
      summative: studentData.summative || {},
      lpcd: studentData.lpcd || {},
      bco: studentData.bco || {},
      dpls: studentData.dpls || {},
      imageUri: studentData.imageUri || '',
      savedAt: new Date().toISOString()
    };

    console.log('💾 Saving student data:', {
      name: studentToSave.name,
      roll: studentToSave.roll,
      hasFormative: Object.keys(studentToSave.formative).length > 0,
      formativeKeys: Object.keys(studentToSave.formative)
    });

    if (existingIndex !== -1) {
      allStudents[existingIndex] = studentToSave;
    } else {
      allStudents.push(studentToSave);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS_LIST, JSON.stringify(allStudents));
    return true;
  } catch (error) {
    console.error('Error saving student:', error);
    return false;
  }
};
// ৪. স্টুডেন্ট ডিলিট করা
export const deleteStudent = async (id) => {
  try {
    const allStudents = await getStudents();
    const filtered = allStudents.filter(s => s.id !== parseInt(id));
    await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS_LIST, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    return false;
  }
};

export const getStudentsByClass = async (className) => {
  try {
    const allStudents = await getStudents();
    const filtered = allStudents.filter(student => student.class === className);

    console.log(`📚 Found ${filtered.length} students for class ${className}`);
    filtered.forEach(s => {
      const hasMarks = s.formative && Object.keys(s.formative).length > 0;
      console.log(`   Roll ${s.roll}: ${s.name} - ${hasMarks ? '✅ has marks' : '❌ no marks'}`);
      if (hasMarks) {
        console.log(`      Marks sample:`, JSON.stringify(s.formative).substring(0, 100));
      }
    });

    return filtered;
  } catch (error) {
    console.error('Error loading students by class:', error);
    return [];
  }
};
// ৬. ক্লাস এবং রোল নম্বর দিয়ে নির্দিষ্ট স্টুডেন্ট খোঁজা
export const getStudentByRoll = async (className, rollNumber) => {
  const classStudents = await getStudentsByClass(className);
  return classStudents.find(s => String(s.roll) === String(rollNumber));
};


// প্রোফাইল সেভ করার জন্য
export const saveProfile = async (profileData) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_KEY, JSON.stringify(profileData));
    return true;
  } catch (error) {
    console.error("Error saving profile", error);
    return false;
  }
};

// প্রোফাইল রিড করার জন্য
export const getProfile = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

// ==================== VERSION FUNCTIONS ====================

// Get saved app version
export const getAppVersion = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
  } catch (error) {
    return null;
  }
};

// Save current app version
export const setAppVersion = async (version) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, version);
    return true;
  } catch (error) {
    return false;
  }
};

// ==================== DATA MIGRATION FUNCTIONS ====================

// চেক করুন পুরানো ডাটা ফরম্যাটে আছে কিনা
export const needsMigration = async () => {
  try {
    const allStudents = await getStudents();
    if (allStudents.length === 0) return false;
    
    // প্রথম স্টুডেন্ট চেক করুন
    const firstStudent = allStudents[0];
    
    // পুরানো ফরম্যাটে marks আছে কিন্তু formative নেই?
    if (firstStudent.marks && !firstStudent.formative) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// ডাটা মাইগ্রেট করুন
export const migrateStudentData = async () => {
  try {
    const allStudents = await getStudents();
    if (allStudents.length === 0) return true;
    
    let migratedCount = 0;
    
    const migratedStudents = allStudents.map(student => {
      // যদি ইতিমধ্যে নতুন ফরম্যাটে থাকে
      if (student.formative && student.summative) {
        return student;
      }
      
      // পুরানো ফরম্যাট থেকে কনভার্ট
      const oldMarks = student.marks || {};
      const newFormative = {};
      const newSummative = {};
      
      Object.keys(oldMarks).forEach(subject => {
        newFormative[subject] = {};
        newSummative[subject] = {};
        
        const marks = oldMarks[subject] || {};
        
        // Formative columns
        ['F1A', 'F1B', 'F1C', 'F2A', 'F2B', 'F2C', 'F3A', 'F3B', 'F3C'].forEach(col => {
          newFormative[subject][col] = marks[col] || '';
        });
        
        // Summative columns
        ['SE1', 'SE2', 'SE3'].forEach(col => {
          newSummative[subject][col] = marks[col] || '';
        });
      });
      
      migratedCount++;
      
      return {
        ...student,
        formative: newFormative,
        summative: newSummative,
        // পুরানো marks রেখে দিচ্ছি ব্যাকআপ হিসেবে
        oldMarksBackup: student.marks,
        migratedAt: new Date().toISOString()
      };
    });
    
    await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS_LIST, JSON.stringify(migratedStudents));
    console.log(`✅ Migrated ${migratedCount} students to new format`);
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};

// ভার্সন আপডেটের সময় মাইগ্রেশন চেক করুন
export const handleVersionUpdate = async (oldVersion, newVersion) => {
  try {
    // ডাটা মাইগ্রেশন দরকার কিনা চেক করুন
    const needsMigrate = await needsMigration();
    
    if (needsMigrate) {
      console.log('🔄 Migrating student data to new format...');
      await migrateStudentData();
    }
    
    // নতুন ভার্সন সেভ করুন
    await setAppVersion(newVersion);
    console.log(`✅ Version updated from ${oldVersion} to ${newVersion}`);
    return true;
  } catch (error) {
    console.error('Version update failed:', error);
    return false;
  }
};