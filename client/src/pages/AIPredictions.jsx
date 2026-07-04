import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';

const SUGGESTIONS = [
  { icon:'🔧', text:'Which equipment needs maintenance soon?' },
  { icon:'📢', text:'Show me all open high priority complaints' },
  { icon:'📦', text:'Which inventory items are running low?' },
  { icon:'🖥️', text:'How many machines are online right now?' },
  { icon:'📅', text:'What lab bookings are scheduled this week?' },
  { icon:'⚠️', text:'Are there any overdue maintenance tasks?' },
  { icon:'📊', text:'Give me a summary of the lab status today' },
  { icon:'🧪', text:'Which Chemistry lab equipment is faulty?' },
];

function formatReply(text) {
  // Convert markdown-like formatting to JSX
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} style={{ fontWeight:700, color:'#16161f', marginTop:i>0?8:0 }}>{line.slice(2,-2)}</div>;
    }
    if (line.startsWith('* ') || line.startsWith('- ')) {
      return <div key={i} style={{ display:'flex', gap:8, marginTop:4 }}>
        <span style={{ color:'#4f46e5', flexShrink:0 }}>•</span>
        <span>{line.slice(2)}</span>
      </div>;
    }
    if (line.match(/^\d+\./)) {
      return <div key={i} style={{ display:'flex', gap:8, marginTop:4 }}>
        <span style={{ color:'#4f46e5', fontWeight:600, flexShrink:0 }}>{line.match(/^\d+/)[0]}.</span>
        <span>{line.replace(/^\d+\.\s*/, '')}</span>
      </div>;
    }
    if (line.trim() === '') return <div key={i} style={{ height:6 }}/>;
    return <div key={i} style={{ marginTop:i>0?4:0 }}>{line}</div>;
  });
}

export default function AIPredictions() {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [hasKey,    setHasKey]    = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role:'user', text:msg }]);
    setLoading(true);
    try {
      const r = await api.post('/assistant/chat', { message:msg });
      setMessages(prev => [...prev, { role:'assistant', text:r.data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error connecting to AI assistant';
      if (errMsg.includes('API key') || errMsg.includes('GEMINI')) setHasKey(false);
      setMessages(prev => [...prev, { role:'error', text:errMsg }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding:'36px 40px', maxWidth:900, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', height:'calc(100vh - 72px)', display:'flex', flexDirection:'column' }}>
      <div style={{ marginBottom:28, borderBottom:'1px solid #ebebf0', paddingBottom:20, flexShrink:0 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>AI assistant</h1>
            <p style={{ fontSize:13, color:'#9494a3', marginTop:5 }}>Ask anything about your labs — powered by Gemini with live database context</p>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background: hasKey?'#eefbf3':'#fef2f2', border:'1px solid '+(hasKey?'#bce8cc':'#f5bcbc') }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:hasKey?'#0f9d58':'#dc2626' }}/>
            <span style={{ fontSize:11, fontWeight:600, color:hasKey?'#0f9d58':'#dc2626' }}>{hasKey ? 'Gemini connected' : 'API key missing'}</span>
          </div>
        </div>
      </div>

      {!hasKey && (
        <div style={{ background:'#fef2f2', border:'1px solid #f5bcbc', borderRadius:12, padding:'16px 20px', marginBottom:20, flexShrink:0 }}>
          <div style={{ fontWeight:600, color:'#dc2626', marginBottom:6 }}>Gemini API key not configured</div>
          <div style={{ fontSize:13, color:'#7c7c8a', lineHeight:1.6 }}>
            To enable the AI assistant, add your Gemini API key to <code style={{ background:'#f7f7f9', padding:'1px 6px', borderRadius:4 }}>server/.env</code>:<br/>
            <code style={{ background:'#f7f7f9', padding:'4px 8px', borderRadius:4, display:'inline-block', marginTop:6 }}>GEMINI_API_KEY=AIza...</code><br/>
            Get a free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color:'#4f46e5' }}>aistudio.google.com</a> then restart the server.
          </div>
        </div>
      )}

      <div style={{ flex:1, overflowY:'auto', marginBottom:16, display:'flex', flexDirection:'column', gap:16 }}>
        {messages.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🤖</div>
              <div style={{ fontSize:16, fontWeight:600, color:'#16161f', marginBottom:6 }}>LabCommand AI assistant</div>
              <div style={{ fontSize:13, color:'#9494a3' }}>Ask me anything about your labs, equipment, bookings or inventory</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {SUGGESTIONS.map((s,i) => (
                <button key={i} onClick={() => send(s.text)}
                  style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:12, padding:'12px 14px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10, transition:'all .12s', fontSize:13, color:'#555' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#4f46e5'; e.currentTarget.style.background='#f7f7ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.background='#fff'; }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{s.icon}</span>
                  <span style={{ lineHeight:1.4 }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                {m.role !== 'user' && (
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginRight:10, marginTop:2 }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth:'75%', padding:'12px 16px', borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
                  background: m.role==='user'?'#4f46e5': m.role==='error'?'#fef2f2':'#fff',
                  color: m.role==='user'?'#fff': m.role==='error'?'#dc2626':'#16161f',
                  border: m.role==='user'?'none': m.role==='error'?'1px solid #f5bcbc':'1px solid #ebebf0',
                  fontSize:13, lineHeight:1.6,
                  boxShadow: m.role==='user'?'none':'0 1px 4px rgba(16,16,31,0.06)',
                }}>
                  {m.role === 'user' ? m.text : formatReply(m.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🤖</div>
                <div style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:'18px 18px 18px 4px', padding:'14px 18px', display:'flex', gap:5 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#c4c4cc', display:'inline-block', animation:'bounce 1s infinite', animationDelay:i*0.15+'s' }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </>
        )}
      </div>

      <div style={{ flexShrink:0 }}>
        {messages.length > 0 && (
          <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
            {SUGGESTIONS.slice(0,4).map((s,i) => (
              <button key={i} onClick={() => send(s.text)}
                style={{ background:'#f7f7f9', border:'1px solid #ebebf0', borderRadius:20, padding:'5px 12px', cursor:'pointer', fontSize:11, color:'#555', display:'flex', alignItems:'center', gap:5 }}>
                <span>{s.icon}</span><span>{s.text.length>30?s.text.slice(0,30)+'…':s.text}</span>
              </button>
            ))}
          </div>
        )}
        <div style={{ display:'flex', gap:10, background:'#fff', border:'1px solid #ebebf0', borderRadius:14, padding:'8px 8px 8px 16px', boxShadow:'0 2px 8px rgba(16,16,31,0.06)' }}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
            placeholder="Ask about equipment, bookings, inventory, complaints..."
            style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'#16161f', background:'transparent' }}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading}
            style={{ background:input.trim()&&!loading?'#4f46e5':'#f0f0f6', color:input.trim()&&!loading?'#fff':'#bbb', border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:input.trim()&&!loading?'pointer':'default', transition:'all .15s' }}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
        <div style={{ fontSize:11, color:'#bbb', textAlign:'center', marginTop:8 }}>
          Powered by Gemini 1.5 Flash · Real-time lab data context
        </div>
      </div>
      <style>{'@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}'}</style>
    </div>
  );
}
