import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDB } from './db'

// ── Gold Theme matching KIS logo ──
const DARK={bg:"#0C0C0C",card:"#161616",card2:"#1C1C1C",border:"#2A2A2A",border2:"#333",text:"#F5F0E8",muted:"#A09882",dim:"#6B6355",accent:"#C9A84C",accentLight:"#E2C97E",accentDark:"#A08530",success:"#4CAF6A",warning:"#E8A840",danger:"#D45050",inputBg:"#1A1A1A",shadow:"rgba(0,0,0,0.4)",glow:"rgba(201,168,76,0.15)"};
const LIGHT={bg:"#FAF8F3",card:"#FFFFFF",card2:"#F5F2EB",border:"#E5DFD0",border2:"#D4CDB8",text:"#1A1508",muted:"#7A7060",dim:"#A09882",accent:"#B8930F",accentLight:"#D4AF37",accentDark:"#8B6E0B",success:"#3D9E5A",warning:"#D49A30",danger:"#C94444",inputBg:"#F8F5EE",shadow:"rgba(0,0,0,0.08)",glow:"rgba(184,147,15,0.08)"};

// ── Lang ──
const LANG={
  en:{appName:"KIS",appSub:"Repair & Wholesales",login:"Sign In",logout:"Logout",name:"Username",password:"Password",dashboard:"Dashboard",settings:"Settings",save:"Save",cancel:"Cancel",delete:"Delete",confirm:"Confirm",search:"Search...",noData:"No data",loading:"Loading...",welcome:"Welcome back",quickStats:"Quick Stats",todayDate:"Today's Date",status:"System Status",online:"Online",version:"Version"},
  cn:{appName:"KIS",appSub:"维修与批发",login:"登录",logout:"登出",name:"用户名",password:"密码",dashboard:"仪表盘",settings:"设置",save:"保存",cancel:"取消",delete:"删除",confirm:"确认",search:"搜索...",noData:"无数据",loading:"加载中...",welcome:"欢迎回来",quickStats:"快速统计",todayDate:"今日日期",status:"系统状态",online:"在线",version:"版本"},
};

// ── Atom Logo SVG (matches KIS branding) ──
function AtomLogo({size=40}){
  const id="g"+Math.random().toString(36).slice(2,6);
  return(
    <svg viewBox="0 0 100 100" width={size} height={size} style={{flexShrink:0}}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8860B"/>
          <stop offset="35%" stopColor="#D4AF37"/>
          <stop offset="65%" stopColor="#E8D48B"/>
          <stop offset="100%" stopColor="#C9A84C"/>
        </linearGradient>
      </defs>
      {/* Orbits */}
      <ellipse cx="50" cy="50" rx="44" ry="18" fill="none" stroke={`url(#${id})`} strokeWidth="3" transform="rotate(-30 50 50)"/>
      <ellipse cx="50" cy="50" rx="44" ry="18" fill="none" stroke={`url(#${id})`} strokeWidth="3" transform="rotate(30 50 50)"/>
      <ellipse cx="50" cy="50" rx="44" ry="18" fill="none" stroke={`url(#${id})`} strokeWidth="3" transform="rotate(90 50 50)"/>
      {/* Core */}
      <circle cx="50" cy="50" r="7" fill={`url(#${id})`}/>
      {/* Electrons */}
      <circle cx="16" cy="34" r="4" fill={`url(#${id})`}/>
      <circle cx="84" cy="66" r="4" fill={`url(#${id})`}/>
      <circle cx="50" cy="8" r="4" fill={`url(#${id})`}/>
      <circle cx="50" cy="92" r="4" fill={`url(#${id})`}/>
    </svg>
  );
}

// ── Helpers ──
const td=()=>{const d=new Date();return d.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});};

// ── Modal ──
function Mod({title,onClose,children,w="500px",T}){return <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}><div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}}/><div style={{position:"relative",background:T.card,borderRadius:16,padding:24,maxWidth:w,width:"95%",maxHeight:"90vh",overflow:"auto",border:`1px solid ${T.border}`,boxShadow:`0 24px 48px ${T.shadow}`}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h3 style={{margin:0,fontSize:16,fontWeight:700,color:T.text}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.dim,transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color=T.accent} onMouseLeave={e=>e.target.style.color=T.dim}>✕</button></div>{children}</div></div>;}
function Fld({label,children}){return <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</label>{children}</div>;}

export default function App(){
  const db=useDB();
  const[theme,setTheme]=useState(()=>localStorage.getItem("kis-theme")||"dark");
  const[lang,setLang]=useState(()=>localStorage.getItem("kis-lang")||"en");
  const[user,setUser]=useState(null);
  const[loginName,setLoginName]=useState("");
  const[loginPass,setLoginPass]=useState("");
  const[tab,setTab]=useState("dashboard");
  const[sz,setSz]=useState("M");
  const[hover,setHover]=useState(null);

  const T=theme==="dark"?DARK:LIGHT;
  const LL=LANG[lang];

  useEffect(()=>{localStorage.setItem("kis-theme",theme);},[theme]);
  useEffect(()=>{localStorage.setItem("kis-lang",lang);},[lang]);

  // ── Styles ──
  const bI={background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",color:T.text,fontSize:13,width:"100%",outline:"none",transition:"border-color 0.2s",boxSizing:"border-box"};
  const pB={display:"inline-flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:`linear-gradient(135deg, ${T.accentDark}, ${T.accent}, ${T.accentLight})`,color:"#111",letterSpacing:"0.3px",transition:"all 0.2s",boxShadow:`0 2px 8px ${T.glow}`};
  const gB={display:"inline-flex",alignItems:"center",gap:4,padding:"7px 14px",borderRadius:8,border:`1px solid ${T.border}`,cursor:"pointer",fontWeight:600,fontSize:12,background:"transparent",color:T.text,transition:"all 0.2s"};
  const dB={...gB,borderColor:T.danger,color:T.danger};
  const fs=sz==="S"?12:sz==="L"?16:14;

  // ── Login ──
  const handleLogin=async()=>{
    const u=db.users.find(x=>x.name?.toLowerCase()===loginName.toLowerCase()&&x.password===loginPass);
    if(u){setUser(u);setLoginName("");setLoginPass("");}
    else alert("Invalid credentials");
  };

  if(db.loading)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:T.bg,gap:16}}>
      <AtomLogo size={60}/>
      <span style={{color:T.accent,fontSize:14,fontWeight:600,letterSpacing:"1px"}}>{LL.loading}</span>
    </div>
  );

  if(!user)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.bg,fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif"}}>
      {/* Subtle background glow */}
      <div style={{position:"fixed",top:"30%",left:"50%",transform:"translate(-50%,-50%)",width:400,height:400,borderRadius:"50%",background:`radial-gradient(circle, ${T.glow} 0%, transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{background:T.card,borderRadius:20,padding:"40px 36px",width:360,border:`1px solid ${T.border}`,boxShadow:`0 16px 48px ${T.shadow}`,position:"relative"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:12,marginBottom:8}}>
            <AtomLogo size={48}/>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:32,fontWeight:900,color:T.accent,letterSpacing:"2px",lineHeight:1}}>KIS</div>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"2.5px",textTransform:"uppercase",marginTop:2}}>Repair & Wholesales</div>
            </div>
          </div>
        </div>
        {/* Divider */}
        <div style={{height:1,background:`linear-gradient(90deg, transparent, ${T.accent}40, transparent)`,marginBottom:24}}/>
        <Fld label={LL.name}><input style={bI} value={loginName} onChange={e=>setLoginName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Enter username" onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/></Fld>
        <Fld label={LL.password}><input style={bI} type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Enter password" onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/></Fld>
        <button onClick={handleLogin} style={{...pB,width:"100%",justifyContent:"center",marginTop:12,padding:"12px 20px",fontSize:14}} onMouseEnter={e=>e.target.style.transform="translateY(-1px)"} onMouseLeave={e=>e.target.style.transform="translateY(0)"}>{LL.login}</button>
      </div>
    </div>
  );

  // ── Stat Card ──
  const StatCard=({label,value,icon})=>(
    <div style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:"20px 24px",flex:"1 1 200px",transition:"all 0.2s",boxShadow:`0 2px 8px ${T.shadow}`}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.boxShadow=`0 4px 16px ${T.glow}`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow=`0 2px 8px ${T.shadow}`;}}>
      <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:22,fontWeight:800,color:T.text,marginBottom:2}}>{value}</div>
      <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>
    </div>
  );

  // ── Main App ──
  return(
    <div style={{background:T.bg,minHeight:"100vh",color:T.text,fontSize:fs,fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif"}}>
      {/* Header */}
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:`0 1px 8px ${T.shadow}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <AtomLogo size={32}/>
          <div>
            <span style={{color:T.accent,fontWeight:900,fontSize:18,letterSpacing:"1.5px"}}>KIS</span>
            <span style={{color:T.dim,fontSize:9,fontWeight:600,marginLeft:8,letterSpacing:"1px",textTransform:"uppercase"}}>{LL.appSub}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{padding:"4px 10px",borderRadius:6,background:T.glow,border:`1px solid ${T.accent}30`}}>
            <span style={{color:T.accent,fontSize:11,fontWeight:700}}>{user.name}</span>
          </div>
          {["S","M","L"].map(s=><button key={s} onClick={()=>setSz(s)} style={{padding:"3px 8px",fontSize:10,fontWeight:700,borderRadius:5,border:`1px solid ${sz===s?T.accent:T.border}`,background:sz===s?`linear-gradient(135deg, ${T.accentDark}, ${T.accent})`:"transparent",color:sz===s?"#111":T.dim,cursor:"pointer",transition:"all 0.2s"}}>{s}</button>)}
          <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer",fontSize:14,padding:"3px 8px",color:T.text,transition:"all 0.2s"}}>{theme==="dark"?"☀️":"🌙"}</button>
          <select value={lang} onChange={e=>setLang(e.target.value)} style={{...bI,width:"auto",padding:"4px 8px",fontSize:11,borderRadius:6}}>
            <option value="en">EN</option><option value="cn">中文</option>
          </select>
          <button onClick={()=>setUser(null)} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${T.danger}40`,background:"transparent",color:T.danger,cursor:"pointer",fontSize:11,fontWeight:600,transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.background=T.danger;e.target.style.color="#fff";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color=T.danger;}}>{LL.logout}</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:2,padding:"6px 20px",borderBottom:`1px solid ${T.border}`,background:T.card}}>
        {["dashboard","settings"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,letterSpacing:"0.3px",background:tab===t?`linear-gradient(135deg, ${T.accentDark}, ${T.accent})`:  "transparent",color:tab===t?"#111":T.muted,transition:"all 0.2s",textTransform:"capitalize"}}>{LL[t]||t}</button>)}
      </div>

      {/* Content */}
      <div style={{padding:20,maxWidth:1200,margin:"0 auto"}}>
        {tab==="dashboard"&&<div>
          {/* Welcome */}
          <div style={{marginBottom:24}}>
            <h2 style={{color:T.text,fontSize:22,fontWeight:800,margin:"0 0 4px"}}>{LL.welcome}, <span style={{color:T.accent}}>{user.name}</span></h2>
            <p style={{color:T.muted,fontSize:13,margin:0}}>{td()}</p>
          </div>

          {/* Stat Cards */}
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:24}}>
            <StatCard icon="⚡" label={LL.status} value={LL.online}/>
            <StatCard icon="📅" label={LL.todayDate} value={new Date().toLocaleDateString()}/>
            <StatCard icon="🔧" label={LL.version} value="1.0.0"/>
          </div>

          {/* Main Card */}
          <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:28,boxShadow:`0 2px 12px ${T.shadow}`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <AtomLogo size={28}/>
              <h3 style={{margin:0,fontSize:16,fontWeight:700,color:T.text}}>KIS {LL.appSub}</h3>
            </div>
            <div style={{height:1,background:`linear-gradient(90deg, ${T.accent}60, transparent)`,marginBottom:16}}/>
            <p style={{color:T.muted,fontSize:13,lineHeight:1.6,margin:0}}>
              Your repair and wholesale management system is ready. Use the navigation above to access different modules.
            </p>
          </div>
        </div>}

        {tab==="settings"&&<div>
          <h3 style={{color:T.text,fontSize:18,fontWeight:800,marginBottom:16}}>{LL.settings}</h3>
          <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:24,boxShadow:`0 2px 12px ${T.shadow}`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg, ${T.accentDark}, ${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#111",fontWeight:800}}>{user.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:T.text}}>{user.name}</div>
                <div style={{fontSize:11,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px"}}>{user.role||"user"}</div>
              </div>
            </div>
            <div style={{height:1,background:T.border,marginBottom:16}}/>
            <div style={{display:"grid",gap:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`}}>
                <span style={{fontSize:12,color:T.muted,fontWeight:600}}>Theme</span>
                <span style={{fontSize:12,color:T.text,fontWeight:700,textTransform:"capitalize"}}>{theme}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`}}>
                <span style={{fontSize:12,color:T.muted,fontWeight:600}}>Language</span>
                <span style={{fontSize:12,color:T.text,fontWeight:700}}>{lang==="en"?"English":"中文"}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`}}>
                <span style={{fontSize:12,color:T.muted,fontWeight:600}}>Font Size</span>
                <span style={{fontSize:12,color:T.text,fontWeight:700}}>{sz}</span>
              </div>
            </div>
          </div>
        </div>}
      </div>

      {/* Footer */}
      <div style={{padding:"16px 20px",textAlign:"center",borderTop:`1px solid ${T.border}`,marginTop:40}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6}}>
          <AtomLogo size={16}/>
          <span style={{fontSize:10,color:T.dim,fontWeight:600,letterSpacing:"1px"}}>KIS REPAIR & WHOLESALES</span>
        </div>
      </div>
    </div>
  );
}
