const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),{spawn}=require('child_process');
(async()=>{
 const [a,b,out]=[+process.argv[2],+process.argv[3],process.argv[4]];
 const br=await chromium.launch({args:['--allow-file-access-from-files']});
 const pg=await br.newPage({viewport:{width:1080,height:1920}});
 await pg.goto('file://'+__dirname+'/mv.html');
 await pg.evaluate(e=>setup(e),JSON.parse(fs.readFileSync(__dirname+'/env.js.json')));
 const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate','24','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-tune','film',out],{stdio:['pipe','inherit','inherit']});
 for(let i=a;i<b;i++){const d=await pg.evaluate(t=>{render(t);return document.getElementById('c').toDataURL('image/jpeg',.93)},i/24);
  const buf=Buffer.from(d.slice(d.indexOf(',')+1),'base64');if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await br.close();console.log('done',out);
})();
