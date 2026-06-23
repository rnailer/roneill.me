/* ============================================================
   brutal.jsx, shared React pieces for the brutalist directions.
   Exposed on window.RonBrutal. Uses window.RonUI + window.RON_CONTENT.
   ============================================================ */
const { Badge: BBadge, Tag: BTag, MetricStat: BMetric, Motif: BMotif } = window.RonUI;
const RCB = window.RON_CONTENT;

const FR = 'rgba(236,234,228,0.28)';
const FR2 = 'rgba(236,234,228,0.5)';
const EDGE = 'clamp(1.25rem, 4vw, 3.5rem)';
const DISP = { fontFamily:'var(--font-display)', fontFeatureSettings:'"liga" 1,"dlig" 1' };
const SHAPE = { globe:'008', sphere:'075', rings:'043', target:'117', grid:'085', 'grid-warp':'029', 'cube-iso':'018', 'cube-open':'004', network:'097', orbit:'086', 'mesh-poly':'108', starburst:'100', compass:'023', arrow:'028', 'arrows-double':'052', ring:'094', spiral:'066', 'dot-grid':'044' };

function Corners({ c = FR2, inset = 8, len = 13, w = 1.5 }){
  const b = { position:'absolute', width:len, height:len, borderColor:c, borderStyle:'solid', borderWidth:0, pointerEvents:'none', transition:'border-color var(--dur) var(--ease-out)' };
  return (<>
    <span style={{ ...b, top:inset, left:inset, borderTopWidth:w, borderLeftWidth:w }} />
    <span style={{ ...b, top:inset, right:inset, borderTopWidth:w, borderRightWidth:w }} />
    <span style={{ ...b, bottom:inset, left:inset, borderBottomWidth:w, borderLeftWidth:w }} />
    <span style={{ ...b, bottom:inset, right:inset, borderBottomWidth:w, borderRightWidth:w }} />
  </>);
}
function Handles({ s = 7, c = 'var(--paper)' }){
  const sq = { position:'absolute', width:s, height:s, background:c }; const o = -s/2;
  return (<>
    <span style={{ ...sq, top:o, left:o }} /><span style={{ ...sq, top:o, left:`calc(50% + ${o}px)` }} /><span style={{ ...sq, top:o, right:o }} />
    <span style={{ ...sq, top:`calc(50% + ${o}px)`, left:o }} /><span style={{ ...sq, top:`calc(50% + ${o}px)`, right:o }} />
    <span style={{ ...sq, bottom:o, left:o }} /><span style={{ ...sq, bottom:o, left:`calc(50% + ${o}px)` }} /><span style={{ ...sq, bottom:o, right:o }} />
  </>);
}
function Reg({ style, size = 13, c = FR2 }){
  return (<span style={{ position:'absolute', width:size, height:size, ...style, pointerEvents:'none' }}>
    <span style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:c, transform:'translateY(-50%)' }} />
    <span style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:c, transform:'translateX(-50%)' }} />
  </span>);
}
function ShapeChip({ motif, size = 120, style }){
  return (
    <figure style={{ margin:0, position:'absolute', ...style }}>
      <div className="checker halftone" style={{ position:'relative', width:size, height:size, border:`1px solid ${FR}`, display:'grid', placeItems:'center' }}>
        <BMotif name={motif} size="58%" opacity={0.85} style={{ filter:'invert(1)' }} />
        <Handles />
      </div>
      <figcaption className="cap" style={{ fontSize:10, color:'var(--orange)', marginTop:9, letterSpacing:'0.08em' }}>Shape {SHAPE[motif]}</figcaption>
    </figure>
  );
}

/* framed shape artboard (checker + motif + handles + corners + spec label) */
function FramedShape({ motif, ratio = '1', hover = false, big = '46%', children, radius = 0 }){
  return (
    <div className="checker halftone" style={{ position:'relative', overflow:'hidden', aspectRatio:ratio, border:`1px solid ${FR}`, borderRadius:radius, display:'grid', placeItems:'center' }}>
      <div style={{ transform:hover?'scale(1.05)':'scale(1)', transition:'transform var(--dur-slow) var(--ease-out)' }}>
        <BMotif name={motif} size={big} opacity={0.85} style={{ filter:'invert(1)' }} />
      </div>
      <Handles />
      <Corners c={hover?'var(--orange)':FR2} inset={9} />
      {children}
    </div>
  );
}

function TopBar(){
  const link = { ...DISP, fontWeight:700, fontSize:12, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--paper)', textDecoration:'none' };
  return (
    <div style={{ position:'sticky', top:0, zIndex:50, borderBottom:`1px solid ${FR}`, background:'color-mix(in srgb, var(--espresso) 82%, transparent)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' }}>
      <div style={{ height:'var(--nav-h)', padding:`0 ${EDGE}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ ...DISP, fontWeight:800, fontSize:24, letterSpacing:'-0.05em', color:'var(--paper)' }}>ron</span>
        <div style={{ display:'flex', alignItems:'center', gap:'clamp(1rem,2.5vw,2rem)' }}>
          {['Work','About','Contact'].map(l=> <a key={l} href={'#'+l.toLowerCase()} style={link}>{l}</a>)}
          <a href="cv.html" style={link}>CV</a>
          <BBadge status="available">Available</BBadge>
        </div>
      </div>
    </div>
  );
}

/* static capabilities strip, grouped */
function Capabilities(){
  const skills = RCB.skills;
  const isGrouped = skills.length && typeof skills[0] === 'object' && skills[0].group;
  return (
    <div style={{ borderTop:`1px solid ${FR}`, borderBottom:`1px solid ${FR}`, padding:`clamp(0.9rem,2vw,1.3rem) ${EDGE}`, background:'var(--espresso-soft)' }}>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'10px 24px', alignItems:'center' }}>
        {isGrouped ? skills.map((g, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <span style={{ color:FR, fontSize:18, fontWeight:300, lineHeight:1 }}>/</span>}
            <span style={{ display:'inline-flex', flexWrap:'wrap', alignItems:'center', gap:'8px 14px' }}>
              <span className="cap" style={{ fontSize:'clamp(10px,1vw,11px)', color:'var(--orange)', letterSpacing:'0.12em', fontWeight:700 }}>{g.group}</span>
              {g.items.map((s, i) => (
                <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:'14px' }}>
                  <span className="cap" style={{ fontSize:'clamp(12px,1.3vw,14px)', color:'var(--grey-400)', letterSpacing:'0.06em' }}>{s}</span>
                  {i < g.items.length - 1 && <span style={{ color:'var(--orange)', fontSize:9 }}>✳</span>}
                </span>
              ))}
            </span>
          </React.Fragment>
        )) : skills.map((s,i)=>(
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:'22px' }}>
            <span className="cap" style={{ fontSize:'clamp(12px,1.4vw,15px)', color:'var(--grey-400)', letterSpacing:'0.06em' }}>{s}</span>
            {i < skills.length-1 && <span style={{ color:'var(--orange)', fontSize:10 }}>✳</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/* the process, three framed stages, design to release */
function Catalog(){
  const steps = [
    { n:'01', motif:'cube-iso', title:'Product Design', blurb:'Turning fuzzy problems into interfaces people actually understand.',
      skills:['UX / UI Design','User Research & Testing','IA & Structure','Prototyping'] },
    { n:'02', motif:'network', title:'Building with AI', blurb:'Shipping real features fast with AI-assisted engineering pipelines.',
      skills:['Claude Code + Codex','MCP Servers','Prompt + Context Eng.','Agent Observability'] },
    { n:'03', motif:'target', title:'Release & Iterate', blurb:'Owning the launch, then sharpening it against real-world signal.',
      skills:['Release Ownership','Cross-Team Coordination','Monitoring & Looker','Iterate on Feedback'] },
  ];
  return (
    <section style={{ borderTop:`1px solid ${FR}`, padding:`clamp(2.5rem,5vw,4rem) ${EDGE}`, background:'var(--espresso-deep)', position:'relative' }}>
      <div className="grain" />
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:'clamp(2rem,4vw,3rem)', flexWrap:'wrap' }}>
          <span className="cap" style={{ fontSize:12, color:'var(--orange)' }}>(03)</span>
          <span className="cap" style={{ fontSize:12, color:'var(--grey-400)', letterSpacing:'0.08em' }}>The process, design to release</span>
          <span style={{ flex:1, height:1, background:FR, minWidth:40 }} />
          <span className="cap" style={{ fontSize:11, color:FR2 }}>03 stages // end to end</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))', gap:'clamp(0.9rem,1.6vw,1.4rem)', alignItems:'stretch' }}>
          {steps.map((s)=>(
            <article key={s.n} style={{ border:`1px solid ${FR}`, borderRadius:2, display:'flex', flexDirection:'column' }}>
              <figure className="checker halftone" style={{ margin:0, position:'relative', aspectRatio:'16/10', borderBottom:`1px solid ${FR}`, display:'grid', placeItems:'center' }}>
                <Corners inset={9} c={FR2} />
                <BMotif name={s.motif} size="40%" opacity={0.85} style={{ filter:'invert(1)' }} />
              </figure>
              <div style={{ padding:'clamp(1.2rem,2.2vw,1.7rem)', display:'flex', flexDirection:'column', flex:1 }}>
                <h3 className="disp" style={{ margin:'0 0 0.7rem', fontWeight:800, fontSize:'clamp(1.5rem,2.6vw,2.1rem)', lineHeight:0.95, letterSpacing:'-0.03em', color:'var(--paper)', textTransform:'lowercase' }}>{accentLast(s.title)}</h3>
                <p style={{ margin:'0 0 1.3rem', fontSize:'clamp(13px,1.1vw,15px)', lineHeight:1.5, color:'var(--grey-400)', textWrap:'pretty', maxWidth:'34ch' }}>{s.blurb}</p>
                <ul style={{ listStyle:'none', margin:'auto 0 0', padding:0, display:'flex', flexDirection:'column', gap:9, borderTop:`1px solid ${FR}`, paddingTop:'1.1rem' }}>
                  {s.skills.map((sk)=>(
                    <li key={sk} className="cap" style={{ display:'flex', alignItems:'center', gap:10, fontSize:'clamp(11px,0.95vw,12.5px)', color:FR2, letterSpacing:'0.06em' }}>
                      <span style={{ color:'var(--orange)', fontSize:9 }}>✳</span>{sk}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* about, story + experience timeline */
function About(){
  const A = RCB.about;
  const splitLead = (t)=>{ const i = t.indexOf(','); return i>0 ? [t.slice(0,i+1), t.slice(i+1)] : [t,'']; };
  return (
    <section id="about" style={{ borderTop:`1px solid ${FR}`, background:'var(--espresso)', color:'var(--paper)', padding:`clamp(2.5rem,6vw,4.5rem) ${EDGE}`, position:'relative' }}>
      <div className="grain" />
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:'clamp(1.5rem,3vw,2.2rem)', flexWrap:'wrap' }}>
          <span className="cap" style={{ fontSize:12, color:'var(--orange)' }}>(04)</span>
          <span className="cap" style={{ fontSize:12, color:'var(--grey-400)', letterSpacing:'0.08em' }}>About, my story</span>
          <span style={{ flex:1, height:1, background:FR, minWidth:40 }} />
          <span className="cap" style={{ fontSize:11, color:FR2 }}>{RCB.location} // since 2013</span>
        </div>
        <h2 className="disp" style={{ margin:'0 0 clamp(2rem,5vw,3.5rem)', fontWeight:800, fontSize:'clamp(3rem,11vw,9rem)', lineHeight:0.82, letterSpacing:'-0.05em', color:'var(--paper)', textTransform:'lowercase' }}>{accentLast('About')}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.25fr) minmax(0,1fr)', gap:'clamp(2rem,5vw,4.5rem)', alignItems:'start' }} className="about-grid">
          <div>
            {A.lead.map((p,i)=>{ const [a,b]=splitLead(p); return (
              <p key={i} style={{ margin:i?'1.4rem 0 0':0, fontSize:'clamp(1.25rem,2.1vw,1.9rem)', lineHeight:1.32, letterSpacing:'-0.01em', textWrap:'pretty' }}>
                <span style={{ color:'var(--paper)' }}>{a}</span><span style={{ color:'var(--grey-400)' }}>{b}</span>
              </p>
            ); })}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:'clamp(1.8rem,3vw,2.4rem)' }}>
              {A.tools.map((t)=> <BTag key={t}>{t}</BTag>)}
            </div>
            <a href="cv.html" className="cap" style={{ display:'inline-flex', alignItems:'center', gap:9, marginTop:'clamp(1.8rem,3vw,2.4rem)', fontSize:13, color:'var(--paper)', textDecoration:'none', border:`1px solid ${FR2}`, borderRadius:999, padding:'10px 20px', letterSpacing:'0.06em' }}>View CV →</a>
          </div>
          <div>
            <div className="cap" style={{ fontSize:11, color:FR2, letterSpacing:'0.12em', marginBottom:'1.2rem' }}>Experience</div>
            <ul style={{ listStyle:'none', margin:0, padding:0 }}>
              {A.timeline.map((e,i)=>(
                <li key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:16, padding:'1.05rem 0', borderTop:`1px solid ${FR}` }}>
                  <span>
                    <span className="disp" style={{ display:'block', fontWeight:700, fontSize:'clamp(1rem,1.5vw,1.2rem)', letterSpacing:'-0.01em', color:'var(--paper)' }}>{e.org}</span>
                    <span style={{ fontSize:13, color:'var(--grey-400)' }}>{e.role}</span>
                  </span>
                  <span className="cap" style={{ fontSize:11, color:FR2, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{e.years}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact({ index = '04' }){
  return (
    <section id="contact" data-theme="highvis" style={{ background:'var(--orange)', color:'var(--espresso)', padding:`clamp(3rem,7vw,6rem) ${EDGE}`, position:'relative', overflow:'hidden' }}>
      <div className="grain" style={{ mixBlendMode:'multiply', opacity:0.25 }} />
      <Reg style={{ top:18, left:18 }} c={'rgba(26,19,16,0.5)'} /><Reg style={{ top:18, right:18 }} c={'rgba(26,19,16,0.5)'} />
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'clamp(1.5rem,4vw,2.5rem)', flexWrap:'wrap', gap:16 }}>
          <span className="cap" style={{ fontSize:12, letterSpacing:'0.08em' }}>({index}) // Let's build</span>
          <BMotif name="arrows-double" size={46} opacity={0.75} />
        </div>
        <a href={'mailto:'+RCB.email} className="disp" style={{ display:'block', textDecoration:'none', fontWeight:800, fontSize:'clamp(2rem,9vw,8rem)', lineHeight:0.9, letterSpacing:'-0.05em', color:'var(--espresso)', textTransform:'lowercase', textWrap:'balance' }}>{RCB.email}</a>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:'clamp(1.5rem,3vw,2rem)' }}>
          <a href={'https://'+RCB.linkedin} className="cap" style={{ fontSize:13, color:'var(--espresso)', textDecoration:'none', borderBottom:'2px solid var(--espresso)', paddingBottom:2 }}>LinkedIn →</a>
          <a href="cv.html" className="cap" style={{ fontSize:13, color:'var(--espresso)', textDecoration:'none', borderBottom:'2px solid var(--espresso)', paddingBottom:2 }}>Download CV →</a>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginTop:'clamp(2.5rem,6vw,4rem)', paddingTop:'var(--space-6)', borderTop:'2px solid var(--espresso)' }}>
          <span className="disp" style={{ fontWeight:800, fontSize:24, letterSpacing:'-0.05em' }}>ron</span>
          <span className="cap" style={{ fontSize:12 }}>// Dublin // 2026</span>
          <span className="cap" style={{ fontSize:12 }}>{RCB.coords}</span>
          <span style={{ letterSpacing:'0.3em', fontWeight:700 }}>+ + +</span>
        </div>
      </div>
    </section>
  );
}

/* render a headline lowercase with last word in orange */
function accentLast(text){
  const w = text.toLowerCase().split(' '); const l = w.pop();
  return React.createElement(React.Fragment, null, w.join(' ')+' ', React.createElement('span',{style:{color:'var(--orange)'}}, l));
}

function LaySwitch({ active }){
  const items = [['index.html','V1 · Index'],['home-reel.html','V2 · Reel'],['home-ledger.html','V3 · Ledger']];
  return (
    <nav className="lay">
      {items.map(([h,l])=> <a key={h} href={h} className={active===h?'on':'alt'}>{l}</a>)}
    </nav>
  );
}

window.RonBrutal = { FR, FR2, EDGE, DISP, SHAPE, Corners, Handles, Reg, ShapeChip, FramedShape, TopBar, Capabilities, Catalog, About, Contact, accentLast, LaySwitch };
