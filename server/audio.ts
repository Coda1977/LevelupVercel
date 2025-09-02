import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

console.log(`Audio OpenAI configured: ${openai ? 'YES' : 'NO'}`);

// Ensure audio directory exists
const audioDir = path.join(process.cwd(), "public", "audio");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

export async function generateAudio(text: string, chapterId: number, voice: string = "alloy"): Promise<string> {
  // Return demo audio path if OpenAI is not configured
  if (!openai) {
    console.log(`Audio generation disabled - OpenAI API key not configured`);
    throw new Error("Audio generation requires valid OpenAI API key");
  }

  try {
    const filename = `chapter-${chapterId}-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, filename);
    
    console.log(`Generating audio for chapter ${chapterId}...`);
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.audio.speech.create({
      model: "tts-1", // Standard quality for faster generation
      voice: voice as any,
      input: text,
      response_format: "mp3",
    });

    // Convert response to buffer and save
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    
    console.log(`Audio generated: ${filename}`);
    
    // Return the public URL path
    return `/audio/${filename}`;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Failed to generate audio");
  }
}

export async function generateHighQualityAudio(text: string, chapterId: number, voice: string = "alloy"): Promise<string> {
  // Return demo audio path if OpenAI is not configured
  if (!openai) {
    console.log(`HD audio generation disabled - OpenAI API key not configured`);
    throw new Error("Audio generation requires valid OpenAI API key");
  }

  try {
    const filename = `chapter-${chapterId}-hd-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, filename);
    
    console.log(`Generating HD audio for chapter ${chapterId}...`);
    
    const response = await openai.audio.speech.create({
      model: "tts-1-hd", // High quality for better audio
      voice: voice as any,
      input: text,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    
    console.log(`HD Audio generated: ${filename}`);
    
    return `/audio/${filename}`;
  } catch (error) {
    console.error("Error generating HD audio:", error);
    throw new Error("Failed to generate HD audio");
  }
}

export function deleteAudioFile(audioUrl: string): void {
  try {
    if (audioUrl && audioUrl.startsWith('/audio/')) {
      const filename = audioUrl.replace('/audio/', '');
      const filePath = path.join(audioDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted audio file: ${filename}`);
      }
    }
  } catch (error) {
    console.error("Error deleting audio file:", error);
  }
}

// Clean up old audio files (optional maintenance function)
export function cleanupOldAudioFiles(daysOld: number = 30): void {
  try {
    const files = fs.readdirSync(audioDir);
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old audio file: ${file}`);
      }
    });
  } catch (error) {
    console.error("Error cleaning up audio files:", error);
  }
}