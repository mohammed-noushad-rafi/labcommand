import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';

const STATUS_COLOR = {
  online:    { bg:'#eefbf3', border:'#bce8cc', dot:'#0f9d58', label:'Online' },
  offline:   { bg:'#fafafd', border:'#e9e9f0', dot:'#a8a8b8', label:'Offline' },
  locked:    { bg:'#fef8ee', border:'#f6dba8', dot:'#d97706', label:'Locked' },
  exam:      { bg:'#fef2f2', border:'#f5bcbc', dot:'#dc2626', label:'Exam' },
  classroom: { bg:'#f6f1fe', border:'#dccdfb', dot:'#7c3aed', label:'Classroom' },
};

const EQUIP_STATUS_COLOR = {
  working:     { bg:'#eefbf3', border:'#bce8cc', dot:'#0f9d58', label:'Working' },
  faulty:      { bg:'#fef2f2', border:'#f5bcbc', dot:'#dc2626', label:'Faulty' },
  maintenance: { bg:'#fef8ee', border:'#f6dba8', dot:'#d97706', label:'Maintenance' },
};

const DEPT_STYLE = {
  'Computer Science': { icon:'🖥️', color:'#4f46e5', bg:'#eef2ff', type:'computers', desc:'Programming, networking and computing labs' },
  'Physics':          { icon:'⚛️',  color:'#0891b2', bg:'#e0f7fa', type:'equipment', desc:'Physics instruments and research labs' },
  'Chemistry':        { icon:'🧪', color:'#0f9d58', bg:'#e8f5e9', type:'equipment', desc:'Chemistry instruments and laboratory work' },
};

const PHYSICS_INSTRUMENTS = ['Oscilloscope','Function Generator','Power Supply','Multimeter','Signal Generator','CRO','Voltmeter','Ammeter','Spectrometer','Potentiometer'];
const CHEMISTRY_INSTRUMENTS = ['Centrifuge','Spectrophotometer','Hot Plate','Magnetic Stirrer','pH Meter','Burette','Pipette','Weighing Balance','Water Bath','Distillation Unit'];

function getStyle(dept) {
  return DEPT_STYLE[dept] || { icon:'🏫', color:'#4f46e5', bg:'#eef2ff', type:'computers', desc:'College laboratory' };
}

function ComputerCard({ machine, onClick }) {
  const st = STATUS_COLOR[machine.status] || STATUS_COLOR.offline;
  return (
    <div onClick={onClick}
      style={{ background:st.bg, border:'1.5px solid ' + st.border, borderRadius:14, padding:'16px', cursor:'pointer', transition:'transform .15s, box-shadow .15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(16,16,30,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:st.dot, flexShrink:0 }}/>
        <span style={{ fontSize:13, fontWeight:700, color:'#16161f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{machine.hostname}</span>
      </div>
      <div style={{ fontSize:10.5, color:'#a8a8b8', marginBottom:10 }}>{machine.ip_address}</div>
      {machine.status === 'online' && machine.cpu_percent != null ? (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#7c7c8a', marginBottom:3 }}>
            <span>CPU</span><span>{Math.round(machine.cpu_percent)}%</span>
          </div>
          <div style={{ height:4, background:'rgba(22,22,31,0.07)', borderRadius:2, marginBottom:6 }}>
            <div style={{ height:4, borderRadius:2, background:machine.cpu_percent>80?'#dc2626':machine.cpu_percent>60?'#d97706':'#0f9d58', width:Math.min(machine.cpu_percent,100)+'%' }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#7c7c8a', marginBottom:3 }}>
            <span>RAM</span><span>{Math.round(machine.ram_percent)}%</span>
          </div>
          <div style={{ height:4, background:'rgba(22,22,31,0.07)', borderRadius:2 }}>
            <div style={{ height:4, borderRadius:2, background:machine.ram_percent>80?'#dc2626':machine.ram_percent>60?'#d97706':'#4f46e5', width:Math.min(machine.ram_percent,100)+'%' }}/>
          </div>
        </div>
      ) : (
        <div style={{ fontSize:11.5, fontWeight:700, color:st.dot, textAlign:'center', marginTop:6 }}>{st.label}</div>
      )}
    </div>
  );
}

function EquipmentCard({ item, style }) {
  const st = EQUIP_STATUS_COLOR[item.status] || EQUIP_STATUS_COLOR.working;
  return (
    <div style={{ background:st.bg, border:'1.5px solid ' + st.border, borderRadius:14, padding:'16px', transition:'transform .15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:st.dot, flexShrink:0 }}/>
        <span style={{ fontSize:12.5, fontWeight:700, color:'#16161f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</span>
      </div>
      <div style={{ fontSize:10.5, color:'#a8a8b8', marginBottom:6 }}>{item.category}</div>
      {item.serial_number && <div style={{ fontSize:10, color:'#bbb', fontFamily:'monospace', marginBottom:6 }}>{item.serial_number}</div>}
      <div style={{ fontSize:11, fontWeight:600, color:st.dot }}>{st.label}</div>
      {item.usage_hours && <div style={{ fontSize:10, color:'#a8a8b8', marginTop:4 }}>{item.usage_hours}h usage · {item.fault_count || 0} faults</div>}
    </div>
  );
}

export default function LabMap() {
  const navigate = useNavigate();
  const [machines,    setMachines]    = useState([]);
  const [equipment,   setEquipment]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dept,  setDept]  = useState(null);
  const [lab,   setLab]   = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io('http://localhost:3001', { auth: { token } });
    socketRef.current.on('machine:status', ({ machineId, status }) => {
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status } : m));
    });
    socketRef.current.on('machine:telemetry', ({ machineId, cpu, ram }) => {
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, cpu_percent:cpu, ram_percent:ram } : m));
    });
    Promise.all([
      api.get('/machines').then(r => setMachines(r.data.data || [])),
      api.get('/equipment').then(r => setEquipment(r.data.data || [])),
      api.get('/labs/departments').then(r => setDepartments(r.data.data || [])),
    ]).finally(() => setLoading(false));
    return () => socketRef.current?.disconnect();
  }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#b4b4c0', fontSize:13 }}>Loading lab map</div>;

  const getMachinesForLab  = (labId) => machines.filter(m => m.lab_id === labId);
  const getEquipmentForLab = (labId) => equipment.filter(e => e.lab_id === labId);
  const getMachinesForDept = (d) => d.labs.flatMap(l => getMachinesForLab(l.id));

  if (lab && dept) {
    const style      = getStyle(dept.department);
    const isComputer = style.type === 'computers';
    const labMachines  = getMachinesForLab(lab.id);
    const labEquipment = getEquipmentForLab(lab.id);
    const items = isComputer ? labMachines : labEquipment;
    const online  = isComputer ? labMachines.filter(m => m.status === 'online').length : labEquipment.filter(e => e.status === 'working').length;
    const problem = isComputer ? labMachines.filter(m => m.status !== 'online' && m.status !== 'offline').length : labEquipment.filter(e => e.status === 'faulty').length;

    return (
      <div style={page}>
        <div style={{ height:3, width:64, borderRadius:2, background:style.color, marginBottom:16 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20, flexWrap:'wrap' }}>
          <button onClick={() => { setLab(null); setDept(null); }} style={backBtn}>← Departments</button>
          <span style={{ color:'#ddd' }}>›</span>
          <button onClick={() => setLab(null)} style={{ ...backBtn, background:style.bg, color:style.color }}>{style.icon} {dept.department}</button>
          <span style={{ color:'#ddd' }}>›</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#16161f' }}>{lab.name}</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e9e9f0' }}>
          <div style={{ width:46, height:46, borderRadius:12, background:style.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{style.icon}</div>
          <div>
            <h1 style={{ fontSize:21, fontWeight:700, color:'#16161f', margin:0 }}>{lab.name}</h1>
            <p style={{ fontSize:13, color:'#7c7c8a', margin:0 }}>
              {isComputer ? 'Live computer monitoring' : 'Scientific instruments'} · {dept.department} · Capacity: {lab.capacity}
            </p>
          </div>
          <div style={{ marginLeft:'auto', background:style.bg, color:style.color, borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:700 }}>
            {isComputer ? items.length + ' computers' : items.length + ' instruments'}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
          {(isComputer ? [
            { label:'Total',   value:labMachines.length,                                                             color:'#4f46e5', bg:'#f5f4fe' },
            { label:'Online',  value:labMachines.filter(m=>m.status==='online').length,                              color:'#0f9d58', bg:'#eefbf3' },
            { label:'Offline', value:labMachines.filter(m=>m.status==='offline').length,                             color:'#a8a8b8', bg:'#fafafd' },
            { label:'Locked',  value:labMachines.filter(m=>['locked','exam','classroom'].includes(m.status)).length, color:'#d97706', bg:'#fef8ee' },
          ] : [
            { label:'Total',       value:labEquipment.length,                                    color:style.color, bg:style.bg },
            { label:'Working',     value:labEquipment.filter(e=>e.status==='working').length,    color:'#0f9d58', bg:'#eefbf3' },
            { label:'Faulty',      value:labEquipment.filter(e=>e.status==='faulty').length,     color:'#dc2626', bg:'#fef2f2' },
            { label:'Maintenance', value:labEquipment.filter(e=>e.status==='maintenance').length,color:'#d97706', bg:'#fef8ee' },
          ]).map(s => (
            <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'16px', textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#7c7c8a', marginTop:3, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {!isComputer && (
          <div style={{ background:'#fafafd', border:'1px solid #e9e9f0', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:12, color:'#7c7c8a' }}>
            {style.icon} This is a {dept.department} lab — showing scientific instruments and equipment status instead of computer telemetry.
            {items.length === 0 && ' Add equipment for this lab in the Equipment module to see it here.'}
          </div>
        )}

        {isComputer && (
          <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
            {Object.entries(STATUS_COLOR).map(([k,v]) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:'#7c7c8a', fontWeight:500 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:v.dot }}/>
                {v.label}
              </div>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#a8a8b8', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #e9e9f0' }}>
            {isComputer ? 'No computers registered for this lab yet' : 'No instruments registered for this lab yet — add them in Equipment'}
          </div>
        ) : isComputer ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
            {labMachines.map(m => <ComputerCard key={m.id} machine={m} onClick={() => navigate('/machines/' + m.id)}/>)}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {labEquipment.map(e => <EquipmentCard key={e.id} item={e} style={style}/>)}
          </div>
        )}
      </div>
    );
  }

  if (dept) {
    const style = getStyle(dept.department);
    const isComputer = style.type === 'computers';
    const deptMachines = getMachinesForDept(dept);
    const online = isComputer ? deptMachines.filter(m => m.status === 'online').length : 0;
    return (
      <div style={page}>
        <div style={{ height:3, width:64, borderRadius:2, background:style.color, marginBottom:16 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e9e9f0' }}>
          <button onClick={() => setDept(null)} style={backBtn}>← Departments</button>
          <span style={{ fontSize:24 }}>{style.icon}</span>
          <div>
            <h1 style={{ fontSize:21, fontWeight:700, color:'#16161f', margin:0 }}>{dept.department}</h1>
            <p style={{ fontSize:13, color:'#7c7c8a', margin:0 }}>
              {dept.labs.length} labs · {isComputer ? deptMachines.length + ' computers · ' + online + ' online' : 'Scientific instruments and equipment'}
            </p>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
          {dept.labs.map((lab, idx) => {
            const labMachines  = getMachinesForLab(lab.id);
            const labEquipment = getEquipmentForLab(lab.id);
            const items = isComputer ? labMachines : labEquipment;
            const good    = isComputer ? labMachines.filter(m=>m.status==='online').length    : labEquipment.filter(e=>e.status==='working').length;
            const bad     = isComputer ? labMachines.filter(m=>m.status==='offline').length   : labEquipment.filter(e=>e.status==='faulty').length;
            const special = isComputer ? labMachines.filter(m=>['locked','exam','classroom'].includes(m.status)).length : labEquipment.filter(e=>e.status==='maintenance').length;
            const goodLabel    = isComputer ? 'Online'  : 'Working';
            const badLabel     = isComputer ? 'Offline' : 'Faulty';
            const specialLabel = isComputer ? 'Locked'  : 'Maint.';
            return (
              <div key={lab.id} onClick={() => setLab(lab)}
                style={{ background:'#fff', border:'1px solid #e9e9f0', borderRadius:16, padding:'22px', cursor:'pointer', transition:'all .15s', boxShadow:'0 1px 3px rgba(16,16,30,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=style.color; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='#e9e9f0'; }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:style.bg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, color:style.color }}>L{idx+1}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#16161f' }}>{lab.name}</div>
                    <div style={{ fontSize:11, color:'#a8a8b8' }}>Capacity: {lab.capacity} · {items.length} {isComputer ? 'computers' : 'instruments'}</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
                  {[
                    { label:goodLabel,    value:good,    color:'#0f9d58', bg:'#eefbf3' },
                    { label:badLabel,     value:bad,     color:'#dc2626', bg:'#fef2f2' },
                    { label:specialLabel, value:special, color:'#d97706', bg:'#fef8ee' },
                  ].map(s => (
                    <div key={s.label} style={{ background:s.bg, borderRadius:8, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:10, color:'#7c7c8a', marginTop:2, fontWeight:500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
                  {items.slice(0,16).map((item, i) => {
                    const color = isComputer
                      ? (STATUS_COLOR[item.status] || STATUS_COLOR.offline).dot
                      : (EQUIP_STATUS_COLOR[item.status] || EQUIP_STATUS_COLOR.working).dot;
                    return <span key={i} title={item.hostname || item.name} style={{ width:10, height:10, borderRadius:'50%', background:color, display:'inline-block' }}/>;
                  })}
                  {items.length > 16 && <span style={{ fontSize:10, color:'#a8a8b8' }}>+{items.length-16}</span>}
                </div>
                <div style={{ fontSize:12, color:style.color, fontWeight:600 }}>
                  {isComputer ? 'View computers →' : 'View instruments →'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={{ height:3, width:64, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:16 }}/>
      <div style={{ marginBottom:28, paddingBottom:20, borderBottom:'1px solid #e9e9f0' }}>
        <h1 style={{ fontSize:23, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.01em' }}>Lab map</h1>
        <p style={{ fontSize:13, color:'#7c7c8a', marginTop:3 }}>Select a department to explore its labs</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
        {departments.map(d => {
          const style = getStyle(d.department);
          const isComputer   = style.type === 'computers';
          const deptMachines = getMachinesForDept(d);
          const deptEquipment= d.labs.flatMap(l => getEquipmentForLab(l.id));
          const items  = isComputer ? deptMachines : deptEquipment;
          const online = isComputer
            ? deptMachines.filter(m => m.status === 'online').length
            : deptEquipment.filter(e => e.status === 'working').length;
          return (
            <div key={d.department} onClick={() => setDept(d)}
              style={{ background:'#fff', border:'1px solid #e9e9f0', borderRadius:18, padding:'28px', cursor:'pointer', transition:'all .18s', boxShadow:'0 1px 3px rgba(16,16,30,0.05)', position:'relative', overflow:'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px ' + style.color + '22'; e.currentTarget.style.borderColor=style.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 3px rgba(16,16,30,0.05)'; e.currentTarget.style.borderColor='#e9e9f0'; }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:style.bg, opacity:0.5 }}/>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:20, position:'relative' }}>
                <div style={{ width:52, height:52, borderRadius:14, background:style.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{style.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:17, fontWeight:700, color:'#16161f' }}>{d.department}</div>
                  <div style={{ fontSize:12, color:'#a8a8b8', marginTop:3 }}>{style.desc}</div>
                  <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{d.lab_count} labs · {items.length} {isComputer ? 'computers' : 'instruments'}</div>
                </div>
                <div style={{ background:style.bg, color:style.color, borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:700 }}>
                  {isComputer ? online + ' online' : online + ' working'}
                </div>
              </div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14 }}>
                {items.slice(0,24).map((item, i) => {
                  const color = isComputer
                    ? (STATUS_COLOR[item.status] || STATUS_COLOR.offline).dot
                    : (EQUIP_STATUS_COLOR[item.status] || EQUIP_STATUS_COLOR.working).dot;
                  return <span key={i} title={item.hostname || item.name} style={{ width:10, height:10, borderRadius:'50%', background:color, display:'inline-block' }}/>;
                })}
                {items.length > 24 && <span style={{ fontSize:10, color:'#a8a8b8', alignSelf:'center' }}>+{items.length-24}</span>}
              </div>
              <div style={{ paddingTop:14, borderTop:'1px solid #f0f0f6', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:12, color:style.color, fontWeight:600 }}>Explore {d.department} labs</span>
                <span style={{ color:style.color }}>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const page   = { padding:'32px 36px', maxWidth:1180, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' };
const backBtn= { background:'#f5f5f7', border:'none', color:'#555', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600 };// LEVEL 1 — Department cards
function DeptLevel({ departments, onSelect }) {
  return (
    <div>
      <div style={{ marginBottom:40 }}>
        <div style={{ width:32, height:3, borderRadius:2, background:'linear-gradient(90deg,#4f46e5,#7c3aed)', marginBottom:14 }}/>
        <h1 style={{ fontSize:26, fontWeight:700, color:'#16161f', margin:0, letterSpacing:'-0.02em' }}>Lab map</h1>
        <p style={{ fontSize:13, color:'#9494a3', marginTop:6 }}>Choose a department to explore</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
        {departments.map(d => {
          const meta = getMeta(d.department);
          return (
            <div key={d.department} onClick={() => onSelect(d)}
              style={{ background:'#fff', border:'1px solid #ebebf0', borderRadius:16, padding:'32px 28px', cursor:'pointer', transition:'all .15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px '+meta.color+'12'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#ebebf0'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ fontSize:34, marginBottom:18 }}>{meta.icon}</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#16161f', marginBottom:4 }}>{d.department}</div>
              <div style={{ fontSize:12, color:'#bbb', fontWeight:500 }}>{d.lab_count} lab{d.lab_count>1?'s':''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


