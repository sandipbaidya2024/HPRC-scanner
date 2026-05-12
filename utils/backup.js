import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { getStudents, saveStudentData } from './database';

const BACKUP_DIR = FileSystem.documentDirectory + 'backups/';

// Ensure backup directory exists
const ensureBackupDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }
};

// Create backup
export const createBackup = async () => {
  try {
    await ensureBackupDir();
    const students = await getStudents();
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      students: students,
      totalStudents: students.length,
    };
    
    const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '_')}.json`;
    const filePath = BACKUP_DIR + fileName;
    
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData, null, 2));
    
    return { success: true, path: filePath, fileName, count: students.length };
  } catch (error) {
    console.error('Backup error:', error);
    return { success: false, error: error.message };
  }
};

// Share backup file
export const shareBackup = async (filePath, fileName) => {
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Share Backup File',
      });
      return true;
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
      return false;
    }
  } catch (error) {
    console.error('Share error:', error);
    return false;
  }
};

// List all backups
export const listBackups = async () => {
  try {
    await ensureBackupDir();
    const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const backupFiles = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = BACKUP_DIR + file;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        backupFiles.push({
          name: file,
          path: filePath,
          size: fileInfo.size,
          date: file.replace('backup_', '').replace('.json', '').replace(/_/g, ':'),
        });
      }
    }
    
    return backupFiles.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error('List backups error:', error);
    return [];
  }
};

// Restore from backup
export const restoreBackup = async (filePath) => {
  try {
    const content = await FileSystem.readAsStringAsync(filePath);
    const backupData = JSON.parse(content);
    
    if (!backupData.students || !Array.isArray(backupData.students)) {
      throw new Error('Invalid backup file format');
    }
    
    // Save all students
    for (const student of backupData.students) {
      await saveStudentData(student);
    }
    
    return { success: true, count: backupData.students.length, timestamp: backupData.timestamp };
  } catch (error) {
    console.error('Restore error:', error);
    return { success: false, error: error.message };
  }
};

// Delete backup
export const deleteBackup = async (filePath) => {
  try {
    await FileSystem.deleteAsync(filePath);
    return true;
  } catch (error) {
    console.error('Delete backup error:', error);
    return false;
  }
};

// Export template CSV
export const exportTemplateCSV = async () => {
  try {
    const subjects = ['1st Language', '2nd Language', 'Mathematics', 'Our Environment', 'Art & Work Education', 'Health & Physical Education'];
    const formativeCols = ['F1A', 'F1B', 'F1C', 'F2A', 'F2B', 'F2C', 'F3A', 'F3B', 'F3C'];
    const summativeCols = ['SE1', 'SE2', 'SE3'];
    
    let csv = 'Name,Class,Roll,Section,';
    
    subjects.forEach(subject => {
      formativeCols.forEach(col => {
        csv += `${subject}_${col},`;
      });
      summativeCols.forEach(col => {
        csv += `${subject}_${col},`;
      });
    });
    
    csv = csv.slice(0, -1) + '\n';
    csv += 'Example Student,IV,1,A,';
    
    subjects.forEach(() => {
      formativeCols.forEach(() => { csv += '85,'; });
      summativeCols.forEach(() => { csv += '90,'; });
    });
    
    csv = csv.slice(0, -1) + '\n';
    
    const filePath = FileSystem.documentDirectory + 'bulk_import_template.csv';
    await FileSystem.writeAsStringAsync(filePath, csv);
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath);
      return true;
    } else {
      Alert.alert('Template Created', 'Template saved locally');
      return true;
    }
  } catch (error) {
    console.error('Template export error:', error);
    return false;
  }
};