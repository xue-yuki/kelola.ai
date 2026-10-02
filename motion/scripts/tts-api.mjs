// Narration from a hosted TTS (ElevenLabs or Fish Audio).
//
//   node scripts/tts-api.mjs list eleven      female Indonesian voices
//   node scripts/tts-api.mjs list fish
//   node scripts/tts-api.mjs gen eleven <voice_id>
//   node scripts/tts-api.mjs gen fish <model_id>
//
// Keys come from ELEVENLABS_API_KEY / FISH_API_KEY. `gen` writes
// out/vo/line-XX.wav; then run: KEEP_VO=1 npm run build
// HTTP goes through curl so the sandbox proxy and CA bundle apply.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { VO } from '../src/timeline.js';

const OUT = path.resolve('out');
const VODIR = path.join(OUT, 'vo');
fs.mkdirSync(VODIR, { recursive: true });

const [cmd, provider, voiceId] = process.argv.slice(2);

function key(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`${name} belum di-set di environment.`);
    process.exit(1);
  }
  return v;
}

function curl(args, outFile) {
  const base = ['-sS', '--fail-with-body', '-m', '120'];
  if (outFile) return execFileSync('curl', [...base, '-o', outFile, ...args]);
  return execFileSync('curl', [...base, ...args], { maxBuffer: 64 * 1024 * 1024 }).toString();
}

const FEMALE = /(female|woman|women|girl|wanita|perempuan|cewe|cewek|ibu|kakak|mbak|lady)/i;

// ---- list ------------------------------------------------------------
function listEleven() {
  const k = key('ELEVENLABS_API_KEY');
  const url = 'https://api.elevenlabs.io/v1/shared-voices?language=id&gender=female&page_size=50&sort=trending';
  const { voices = [] } = JSON.parse(curl(['-H', `xi-api-key: ${k}`, url]));
  const rows = voices.map((v) => ({
    id: v.voice_id,
    owner: v.public_owner_id,
    name: v.name,
    info: [v.age, v.accent, v.descriptive, v.use_case].filter(Boolean).join(', '),
    preview: v.preview_url,
  }));
  return rows;
}

function listFish() {
  const k = key('FISH_API_KEY');
  const rows = [];
  for (let page = 1; page <= 3; page++) {
    const url = `https://api.fish.audio/model?page_size=50&page_number=${page}&language=id&sort_by=score`;
    const { items = [] } = JSON.parse(curl(['-H', `Authorization: Bearer ${k}`, url]));
    for (const m of items) {
      const tags = (m.tags || []).map((t) => String(t).toLowerCase());
      const female = tags.length ? tags[0] === 'female' : FEMALE.test(`${m.title} ${m.description}`);
      if (!female || tags.includes('character-voice') || tags.includes('asmr')) continue;
      rows.push({
        id: m._id,
        name: m.title,
        info: [(m.tags || []).join('/'), `${m.like_count ?? 0} likes`, `${m.task_count ?? 0} uses`].join(', '),
        preview: m.samples?.[0]?.audio || `https://fish.audio/m/${m._id}`,
      });
    }
    if (items.length < 50) break;
  }
  return rows;
}

// ---- generate --------------------------------------------------------
function toWav(src, dst) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', dst]);
  fs.unlinkSync(src);
}

function genEleven(id) {
  const k = key('ELEVENLABS_API_KEY');
  const model = process.env.ELEVEN_MODEL || 'eleven_multilingual_v2';
  const owner = process.env.ELEVEN_OWNER;
  // Shared-library voices must be added to "My Voices" before use.
  if (owner) {
    try {
      curl(['-X', 'POST', '-H', `xi-api-key: ${k}`, '-H', 'Content-Type: application/json',
        '-d', JSON.stringify({ new_name: `kelola-narator-${id.slice(0, 6)}` }),
        `https://api.elevenlabs.io/v1/voices/add/${owner}/${id}`]);
    } catch (e) {
      console.warn('add voice:', String(e.stdout || e.message).slice(0, 200));
    }
  }
  VO.forEach((line, i) => {
    const base = path.join(VODIR, `line-${String(i + 1).padStart(2, '0')}`);
    const body = {
      text: line.tts || line.text,
      model_id: model,
      voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
    };
    curl(['-X', 'POST', '-H', `xi-api-key: ${k}`, '-H', 'Content-Type: application/json', '-d', JSON.stringify(body),
      `https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`], base + '.mp3');
    toWav(base + '.mp3', base + '.wav');
    console.log(`${i + 1}/${VO.length}  ${line.text}`);
  });
}

function genFish(id) {
  const k = key('FISH_API_KEY');
  const model = process.env.FISH_MODEL || 's1';
  VO.forEach((line, i) => {
    const base = path.join(VODIR, `line-${String(i + 1).padStart(2, '0')}`);
    const body = { text: line.tts || line.text, reference_id: id, format: 'mp3', mp3_bitrate: 128, normalize: true, latency: 'normal' };
    curl(['-X', 'POST', '-H', `Authorization: Bearer ${k}`, '-H', `model: ${model}`, '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(body), 'https://api.fish.audio/v1/tts'], base + '.mp3');
    toWav(base + '.mp3', base + '.wav');
    console.log(`${i + 1}/${VO.length}  ${line.text}`);
  });
}

// ---- main ------------------------------------------------------------
if (cmd === 'list' && (provider === 'eleven' || provider === 'fish')) {
  const rows = provider === 'eleven' ? listEleven() : listFish();
  fs.writeFileSync(path.join(OUT, `voices-${provider}.json`), JSON.stringify(rows, null, 2));
  rows.forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. ${r.name}  [${r.id}]${r.owner ? ` owner=${r.owner}` : ''}\n    ${r.info}\n    ${r.preview}`));
  console.log(`\n${rows.length} suara -> out/voices-${provider}.json`);
} else if (cmd === 'gen' && voiceId && (provider === 'eleven' || provider === 'fish')) {
  provider === 'eleven' ? genEleven(voiceId) : genFish(voiceId);
  console.log('selesai. lanjut: KEEP_VO=1 npm run build');
} else {
  console.log('usage: node scripts/tts-api.mjs list <eleven|fish> | gen <eleven|fish> <voice_id>');
  process.exit(1);
}
