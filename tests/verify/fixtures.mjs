// Builds every test file the verification scripts use, with the local ffmpeg.
// Run once: node tests/verify/fixtures.mjs   (files go to tests/verify/.fixtures, ignored by git)
import fs from 'fs';
import { FIXTURES, fixture, ffmpeg } from './lib.mjs';

fs.mkdirSync(FIXTURES, { recursive: true });
const make = (name, args) => {
  if (fs.existsSync(fixture(name))) return console.log(`have  ${name}`);
  console.log(`make  ${name}`);
  ffmpeg([...args, fixture(name)]);
};

// Sound
make('music.wav', ['-f', 'lavfi', '-i', 'anoisesrc=color=pink:duration=6:amplitude=0.3', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=6', '-filter_complex', '[0][1]amix=inputs=2,aformat=channel_layouts=stereo', '-ar', '44100']);
make('music96.mp3', ['-i', fixture('music.wav'), '-b:a', '96k']);
make('mono.wav', ['-i', fixture('music.wav'), '-ac', '1']);
make('noisy.wav', ['-f', 'lavfi', '-i', 'sine=f=220:d=6,volume=0.6', '-f', 'lavfi', '-i', 'anoisesrc=c=pink:d=6:a=0.08', '-filter_complex', '[0][1]amix=inputs=2:normalize=0', '-ar', '48000', '-ac', '1']);

// Video (testsrc2 prints a frame counter and timer, handy for checking first/last frames)
make('hd.mp4', ['-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30:duration=10', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=10', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-g', '60', '-c:a', 'aac', '-shortest']);
make('clip.mp4', ['-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=15:duration=4', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest']);
make('silent.webm', ['-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=15:duration=3', '-c:v', 'libvpx', '-b:v', '300k', '-an']);
make('old.avi', ['-i', fixture('hd.mp4'), '-t', '6', '-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'mp3']);
// Long 4K video like the one that broke the file row (74 s, 3840×2160 → 37 pictures at "every 2 s")
// (about 90 MB, like the real file: 12 fps and low quality keep it small.)
make('long4k.mp4', ['-f', 'lavfi', '-i', 'testsrc2=size=3840x2160:rate=12:duration=74', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=74', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '38', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest']);

console.log(`\nTest files ready in ${FIXTURES}`);
