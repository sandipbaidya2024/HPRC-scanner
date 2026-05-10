import * as TextRecognition from '@react-native-ml-kit/text-recognition';

async function testMLKit() {
  console.log('Testing ML Kit...');
  
  // Use a sample image path - replace with your actual image path
  const imagePath = 'file:///path/to/your/test/image.jpg';
  
  try {
    const result = await TextRecognition.recognize(imagePath);
    console.log('Text found:', result.text);
    console.log('Blocks:', result.blocks?.length);
  } catch (error) {
    console.error('ML Kit error:', error);
  }
}

// testMLKit();