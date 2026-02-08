import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
  
  try {
    const getIconsByFolder = (dirPath: string) => {
      const result: Record<string, string[]> = {};
      const folders = fs.readdirSync(dirPath);

      folders.forEach((folder) => {
        const fullFolderPath = path.join(dirPath, folder);
        if (fs.statSync(fullFolderPath).isDirectory()) {
          const files = fs.readdirSync(fullFolderPath);
          const iconsInFolder: string[] = [];
          
          files.forEach((file) => {
            if (file.match(/\.(png|jpe?g|svg|webp)$/i)) {
              // Encode each segment to handle special characters like ' and Japanese names safely in URLs
              const relativePath = `/avatars/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
              iconsInFolder.push(relativePath);
            }
          });
          
          if (iconsInFolder.length > 0) {
            result[folder] = iconsInFolder;
          }
        }
      });

      return result;
    };

    const groupedIcons = getIconsByFolder(avatarsDir);
    return NextResponse.json(groupedIcons);
  } catch (error) {
    console.error('Failed to scan avatars directory', error);
    return NextResponse.json({}, { status: 500 });
  }
}