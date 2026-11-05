/* Build a separate offline container edition; never rewrite the web originals.
 * SHARP_PATH=/path/to/sharp node tools/build-xhs.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const sharp = require(process.env.SHARP_PATH || 'sharp');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output', 'xiaohongshu');
const stage = path.join(output, 'staging');
const archive = path.join(output, '玫瑰战争-小红书离线版.zip');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function write(file, text) {
  const target = path.join(stage, file);
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, text);
}
function replaceOnce(text, from, to) {
  assert.equal(text.split(from).length, 2, 'build anchor must occur exactly once: ' + from.slice(0,65));
  return text.replace(from, to);
}
const banned = [
  /\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\b(?:WebSocket|EventSource|RTCPeerConnection|Worker|SharedWorker)\s*\(/,
  /navigator\.(?:geolocation|clipboard|bluetooth|usb|hid|serial|getBattery|connection|credentials|locks|serviceWorker)\b/,
  /navigator\.storage\.persist/, /(?:getDisplayMedia|enumerateDevices)\s*\(/,
  /(?:Accelerometer|Gyroscope|Magnetometer|AmbientLightSensor|DeviceMotionEvent|DeviceOrientationEvent)/,
  /['"](?:devicemotion|deviceorientation)['"]/, /(?:requestFullscreen|webkitRequestFullscreen|exitFullscreen)/,
  /\beval\s*\(/, /new\s+Function\s*\(/, /WebAssembly\s*\./,
  /window\.(?:open|prompt)\s*\(/, /location\.(?:href\s*=|assign\s*\(|replace\s*\()/,
  /document\.execCommand\s*\(/, /(?:PaymentRequest|Notification|PushManager|NDEFReader|requestMIDIAccess|requestPointerLock|showSaveFilePicker)\b/,
  /<\s*(?:iframe|object|embed|base|form)\b/i, /\bon\w+\s*=\s*["']/i,
  /javascript\s*:/i, /\btarget\s*=\s*['"]_blank/i, /<a\b[^>]*\bdownload/i
];
async function build() {
  fs.mkdirSync(output, {recursive:true});
  fs.rmSync(stage, {recursive:true, force:true});
  fs.mkdirSync(stage, {recursive:true});
  let html = read('index.html');
  const resources = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]);
  assert.ok(resources.every(file => !/^(?:\/|\w+:)/.test(file)));
  html = html.replace(/((?:src|href)=")(?!(?:\.\/))([^"#]+)"/g, '$1./$2"');
  html = replaceOnce(html, 'width=device-width,initial-scale=1,viewport-fit=cover', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
  html = replaceOnce(html, '</head>', '  <link rel="stylesheet" href="./xhs-container.css">\n</head>');
  assert.ok(!/http-equiv\s*=\s*["']Content-Security-Policy/i.test(html), 'the container supplies CSP');
  assert.ok([...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].every(m => /\bsrc=/.test(m[1]) && !m[2].trim()));
  write('index.html', html);
  for (const file of resources) {
    let text = read(file);
    if (file === 'app.js') {
      text = replaceOnce(text, "${button('fullscreen', icon('expand'), 'icon-button fullscreen-toggle', 'aria-label=\"切换全屏\"')}", '');
      const fullscreen = text.split('\n').filter(line => line.includes("case 'fullscreen':"));
      assert.equal(fullscreen.length, 1);
      text = replaceOnce(text, fullscreen[0] + '\n', '');
      text = replaceOnce(text, '    audioContext ||= new Audio();', '    try { audioContext ||= new Audio(); } catch (_) { return null; }');
    }
    if (file.endsWith('.css')) text = text.replace(/env\((safe-area-inset-(?:top|right|bottom|left))\)/g, 'env($1,0px)');
    write(file, text);
  }
  write('xhs-container.css', read('packaging/xhs-container.css'));
  const sandbox = {window:{}};
  vm.runInNewContext(read('assets/art.js'), sandbox);
  const art = sandbox.window.BOOK_ART, images = [];
  for (const [group, values] of Object.entries(art)) {
    for (const [id, source] of Object.entries(values)) {
      const destination = `assets/art/${id}.webp`;
      const sourcePath = path.join(root, source);
      const target = path.join(stage, destination);
      fs.mkdirSync(path.dirname(target), {recursive:true});
      const before = await sharp(sourcePath).metadata();
      const info = await sharp(sourcePath).rotate().resize({width:1200,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:6}).toFile(target);
      assert.ok(info.size < 500000, 'image must fit 500KB: ' + id);
      art[group][id] = './' + destination;
      images.push({id,source,destination,originalBytes:fs.statSync(sourcePath).size,bytes:info.size,originalSize:[before.width,before.height],size:[info.width,info.height]});
    }
  }
  write('assets/art.js', '// Locally encoded copies of the supplied paintings; originals stay in the project.\nwindow.BOOK_ART = ' + JSON.stringify(art,null,2) + ';\n');
  const files = fs.readdirSync(stage,{recursive:true}).filter(name => fs.statSync(path.join(stage,name)).isFile()).sort();
  assert.equal(images.length,13);
  const allowed = new Set(['.html','.css','.js','.png','.jpg','.jpeg','.gif','.webp','.svg','.woff','.woff2','.json']);
  const checkedPaths = [];
  for (const file of files) {
    assert.ok(allowed.has(path.extname(file)), 'unsupported file: ' + file);
    assert.ok(!/(?:node_modules|\.git|\.DS_Store|\.map$)/.test(file));
    if (!/\.(?:html|css|js)$/.test(file)) continue;
    const text = fs.readFileSync(path.join(stage,file),'utf8');
    for (const pattern of banned) assert.ok(!pattern.test(text), file + ': forbidden ' + pattern);
    // SVG namespace strings are identifiers, never resource requests.
    const withoutNamespaces = text.replaceAll('http://www.w3.org/2000/svg','');
    assert.ok(!/https?:\/\//.test(withoutNamespaces), file + ': external URL');
    if (file.endsWith('.js')) {
      const syntax = spawnSync(process.execPath,['--check',path.join(stage,file)],{encoding:'utf8'});
      assert.equal(syntax.status,0,syntax.stderr);
    }
    const paths = [...text.matchAll(/(?:src|href)="([^"<>]+)"/g), ...text.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)].map(m=>m[1]);
    for (const ref of paths) {
      if (ref.startsWith('data:') || decodeURIComponent(ref).startsWith('#') || ref.includes('${')) continue;
      assert.ok(!/^(?:\/|\w+:)/.test(ref),file+': path is not relative '+ref);
      const local = path.resolve(path.dirname(path.join(stage,file)),ref);
      assert.ok(local.startsWith(stage+path.sep) && fs.existsSync(local),file+': missing resource '+ref);
      checkedPaths.push({file,ref});
    }
  }
  for (const asset of images) assert.ok(fs.existsSync(path.join(stage,asset.destination)));
  const zip = spawnSync('python3',['-c',
    'import pathlib,sys,zipfile\np=pathlib.Path(sys.argv[1])\nwith zipfile.ZipFile(sys.argv[2],"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:\n for f in sorted(p.rglob("*")):\n  if f.is_file(): z.write(f,f.relative_to(p).as_posix())\nwith zipfile.ZipFile(sys.argv[2]) as z:\n assert z.testzip() is None\n assert "index.html" in z.namelist()\n assert len([n for n in z.namelist() if n.endswith(".html")])==1',stage,archive],{encoding:'utf8'});
  assert.equal(zip.status,0,zip.stderr);
  const bytes=fs.statSync(archive).size;
  assert.ok(bytes < 2000000, 'recommended archive size exceeded: '+bytes);
  const report={archive,bytes,files:files.length,images,checkedPaths,checks:['root index.html','allowed file types only','external scripts only','relative local assets','no forbidden capability calls','no external requests','no custom CSP','all JS syntax','13 WebP images under 500KB','archive under 2MB','ZIP CRC']};
  fs.writeFileSync(path.join(output,'build-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({archive,bytes,files:files.length,images:images.length,maxImageBytes:Math.max(...images.map(i=>i.bytes))},null,2));
}
build().catch(error=>{console.error(error);process.exitCode=1;});
