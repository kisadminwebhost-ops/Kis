import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from './supabase'

function jobFromDB(r) {
  return {
    id: r.id, techId: r.tech_id, model: r.model, storage: r.storage || '',
    color: r.color || '', grade: r.grade || '', batch: r.batch || '',
    imei: r.imei || '', serial: r.serial || '', jobType: r.job_type,
    subJobs: r.sub_jobs || [], remark: r.remark || '', qty: r.qty || 1,
    status: r.status, mode: r.mode || 'repair', redoReason: r.redo_reason || '',
    redoRemark: r.redo_remark || '', redoSubJobs: r.redo_sub_jobs || '',
    dateIn: r.date_in, dateDone: r.date_done || null,
    extraIssues: r.extra_issues || '', waitingParts: r.waiting_parts || false,
    partsDetail: r.parts_detail || '', qcBy: r.qc_by || '', redoSeen: r.redo_seen !== false,
    outsourceTo: r.outsource_to || '', outsourceReason: r.outsource_reason || '',
    deleted: r.deleted || false, component: r.component || 'full',
  };
}

function jobToDB(j) {
  const d = {};
  if (j.id !== undefined) d.id = j.id;
  if (j.techId !== undefined) d.tech_id = j.techId;
  if (j.model !== undefined) d.model = j.model;
  if (j.storage !== undefined) d.storage = j.storage;
  if (j.color !== undefined) d.color = j.color;
  if (j.grade !== undefined) d.grade = j.grade;
  if (j.batch !== undefined) d.batch = j.batch;
  if (j.imei !== undefined) d.imei = j.imei;
  if (j.serial !== undefined) d.serial = j.serial;
  if (j.jobType !== undefined) d.job_type = j.jobType;
  if (j.subJobs !== undefined) d.sub_jobs = j.subJobs;
  if (j.remark !== undefined) d.remark = j.remark;
  if (j.qty !== undefined) d.qty = j.qty;
  if (j.status !== undefined) d.status = j.status;
  if (j.mode !== undefined) d.mode = j.mode;
  if (j.redoReason !== undefined) d.redo_reason = j.redoReason;
  if (j.redoRemark !== undefined) d.redo_remark = j.redoRemark;
  if (j.redoSubJobs !== undefined) d.redo_sub_jobs = j.redoSubJobs;
  if (j.dateIn !== undefined) d.date_in = j.dateIn;
  if (j.dateDone !== undefined) d.date_done = j.dateDone;
  if (j.extraIssues !== undefined) d.extra_issues = j.extraIssues;
  if (j.waitingParts !== undefined) d.waiting_parts = j.waitingParts;
  if (j.partsDetail !== undefined) d.parts_detail = j.partsDetail;
  if (j.qcBy !== undefined) d.qc_by = j.qcBy;
  if (j.redoSeen !== undefined) d.redo_seen = j.redoSeen;
  if (j.outsourceTo !== undefined) d.outsource_to = j.outsourceTo;
  if (j.outsourceReason !== undefined) d.outsource_reason = j.outsourceReason;
  if (j.deleted !== undefined) d.deleted = j.deleted;
  if (j.component !== undefined) d.component = j.component;
  return d;
}

function invFromDB(r) {
  return {
    product: r.product, size: r.size || '', color: r.color || '',
    imei: r.imei || '', serial: r.serial || '', grade: r.grade || '',
    batchId: r.batch_id, conditionRemark: r.condition_remark || '', _dbId: r.id, createdAt: r.created_at || '',
    codeId: r.code_id || '', modelNo: r.model_no || '', batchRemark: r.batch_remark || '',
    glassStatus: r.glass_status || 'na', cameraStatus: r.camera_status || 'na',
    cameraDetail: r.camera_detail || {}, lcdFault: (r.camera_detail?.lcdFault) || '', lcdFaults: (r.camera_detail?.lcdFaults) || [], lcdFaultsRemark: (r.camera_detail?.lcdFaultsRemark) || '', camPartsNote: (r.camera_detail?.partsNote) || '', glassShadow: (r.camera_detail?.glassShadow) || '', glassShadowRemark: (r.camera_detail?.glassShadowRemark) || '', hsServicing: (r.camera_detail?.hsServicing) || [], hsServicingRemark: (r.camera_detail?.hsServicingRemark) || '', hsUnfixable: (r.camera_detail?.hsUnfixable) || '', techQc: (r.camera_detail?.techQc) || [], techQcRemark: (r.camera_detail?.techQcRemark) || '', hsParts: (r.camera_detail?.hsParts) || [], hsPartsRemark: (r.camera_detail?.hsPartsRemark) || '', partsUsed: (r.camera_detail?.partsUsed) || [], glassServicing: (r.camera_detail?.glassServicing) || [], glassAutoSkip: (r.camera_detail?.glassAutoSkip) || false, cameraAutoSkip: (r.camera_detail?.cameraAutoSkip) || false,
    newColor: (r.camera_detail?.newColor) || '', housingStatus: (r.camera_detail?.housingStatus) || 'na', housingSteps: (r.camera_detail?.housingSteps) || [],
    stepLog: (r.camera_detail?.stepLog) || [], redoHistory: (r.camera_detail?.redoHistory) || [],
    icmIssues: (r.camera_detail?.icmIssues) || [],
    warehouseId: r.warehouse_id || null,
  };
}

function sjFromDB(r) {
  return { name: r.name, cn: r.cn || '', options: r.options || [], tab: r.tab || 'repair', _dbId: r.id };
}

export function useDataService() {
  const [user, setUser] = useState(null);
  const [techs, setTechs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [subJobs, setSubJobs] = useState([]);
  const [inv, setInv] = useState([]);
  const [repairHouses, setRepairHouses] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [remarkCodes, setRemarkCodes] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [commRates, setCommRates] = useState([]);
  const [partsInv, setPartsInv] = useState([]);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginated fetch to bypass Supabase 1000-row cap
  const fetchAllJobs = async () => {
    let all = [], from = 0;
    while (true) {
      const { data } = await supabase.from('jobs').select('*').order('date_in', { ascending: false }).range(from, from + 999);
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < 1000) break;
      from += 1000;
    }
    return all;
  };

  const refreshAll = useCallback(async () => {
    const [tRes, jobsAll, sjRes, iRes] = await Promise.all([
      supabase.from('technicians').select('*').order('id'),
      fetchAllJobs(),
      supabase.from('sub_jobs').select('*').order('id'),
      supabase.from('inventory').select('*').order('id'),
    ]);
    if (tRes.data) setTechs(tRes.data);
    if (jobsAll) setJobs(jobsAll.map(jobFromDB));
    if (sjRes.data) setSubJobs(sjRes.data.map(sjFromDB));
    if (iRes.data) setInv(iRes.data.map(invFromDB));
    try { const rhRes = await supabase.from('repair_houses').select('*').order('name'); if (rhRes.data) setRepairHouses(rhRes.data); } catch(e) { console.log('repair_houses not ready:', e); }
    try { const alRes = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(200); if (alRes.data) setAdminLogs(alRes.data); } catch(e) { console.log('admin_logs not ready:', e); }
    try { const rcRes = await supabase.from('remark_codes').select('*').order('code'); if (rcRes.data) setRemarkCodes(rcRes.data); } catch(e) { console.log('remark_codes not ready:', e); }
    try { const fbRes = await supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(100); if (fbRes.data) setFeedback(fbRes.data); } catch(e) { console.log('feedback not ready:', e); }
    try { const crRes = await supabase.from('commission_rates').select('*').order('section,step'); if (crRes.data) setCommRates(crRes.data); } catch(e) { console.log('commission_rates not ready:', e); }
    try { const piRes = await supabase.from('parts_inventory').select('*').eq('active', true).order('category,name'); if (piRes.data) setPartsInv(piRes.data); } catch(e) { console.log('parts_inventory not ready:', e); }
    try { const chRes = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(200); if (chRes.data) setChatMsgs(chRes.data); } catch(e) { console.log('chat_messages not ready:', e); }
    try { const nfRes = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100); if (nfRes.data) setNotifs(nfRes.data); } catch(e) { console.log('notifications not ready:', e); }
    try { const byRes = await supabase.from('buyers').select('*').eq('active', true).order('name'); if (byRes.data) setBuyers(byRes.data); } catch(e) { console.log('buyers not ready:', e); }
    try { const boRes = await supabase.from('buyer_orders').select('*').order('created_at', { ascending: false }); if (boRes.data) setBuyerOrders(boRes.data); } catch(e) { console.log('buyer_orders not ready:', e); }
    try { const oiRes = await supabase.from('order_items').select('*').order('id'); if (oiRes.data) setOrderItems(oiRes.data); } catch(e) { console.log('order_items not ready:', e); }
    setLoading(false);
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // Auto-refresh jobs + inventory every 15 seconds for real-time sync
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const [jobsAll, iRes] = await Promise.all([
          fetchAllJobs(),
          supabase.from('inventory').select('*').order('id'),
        ]);
        if (jobsAll) setJobs(jobsAll.map(jobFromDB));
        if (iRes.data) setInv(iRes.data.map(invFromDB));
      } catch(e) {}
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const refreshJobs = useCallback(async () => {
    const data = await fetchAllJobs();
    if (data) setJobs(data.map(jobFromDB));
  }, []);
  const refreshInv = useCallback(async () => {
    const { data } = await supabase.from('inventory').select('*').order('id');
    if (data) setInv(data.map(invFromDB));
  }, []);
  const refreshTechs = useCallback(async () => {
    const { data } = await supabase.from('technicians').select('*').order('id');
    if (data) setTechs(data);
  }, []);
  const refreshSJ = useCallback(async () => {
    const { data } = await supabase.from('sub_jobs').select('*').order('id');
    if (data) setSubJobs(data.map(sjFromDB));
  }, []);

  const login = useCallback((id, pw) => {
    if (id.toLowerCase() === 'admin' && pw === 'admin123') {
      const u = { id: 'admin', name: 'Admin', role: 'superadmin' }; setUser(u); return { ok: true, user: u };
    }
    const t = techs.find(t => t.id.toUpperCase() === id.toUpperCase() && t.password === pw);
    if (t) { const role = t.role || 'tech'; const u = { id: t.id, name: t.name, role }; setUser(u); return { ok: true, user: u }; }
    return { ok: false };
  }, [techs]);
  const logout = useCallback(() => setUser(null), []);

  const gId = () => Math.random().toString(36).substr(2, 9);

  const createJob = useCallback(async (data) => {
    const id = gId();
    const now = new Date().toISOString();
    const job = { id, ...data, dateIn: data.dateIn || now };
    const { error } = await supabase.from('jobs').insert(jobToDB(job));
    if (error) { console.error('createJob ERROR:', error.code, error.message, error.details, error.hint, 'DATA:', JSON.stringify(jobToDB(job))); }
    if (!error) await refreshJobs();
    return job;
  }, [refreshJobs]);

  const updateJob = useCallback(async (id, fields) => {
    const { error } = await supabase.from('jobs').update(jobToDB(fields)).eq('id', id);
    if (!error) await refreshJobs();
  }, [refreshJobs]);

  const setJobStatus = useCallback(async (id, status, extra = {}) => {
    const now = new Date().toISOString();
    const updates = { status, ...extra };
    if (['qc-pending', 'completed', 'redo-flagged', 'outsourced', 'direct-sell'].includes(status)) updates.dateDone = now;
    console.log('setJobStatus:', id, status, JSON.stringify(jobToDB(updates)));
    const { error } = await supabase.from('jobs').update(jobToDB(updates)).eq('id', id);
    if (error) console.error('setJobStatus ERROR:', error);
    if (!error) await refreshJobs();
  }, [refreshJobs]);

  const deleteJob = useCallback(async (id) => {
    const { error } = await supabase.from('jobs').update({ deleted: true }).eq('id', id);
    if (!error) await refreshJobs();
  }, [refreshJobs]);

  const restoreJob = useCallback(async (id) => {
    const { error } = await supabase.from('jobs').update({ deleted: false }).eq('id', id);
    if (!error) await refreshJobs();
  }, [refreshJobs]);

  const refreshLogs = useCallback(async () => {
    try { const { data } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(200); if (data) setAdminLogs(data); } catch(e) {}
  }, []);

  const logAdminAction = useCallback(async (adminName, action, jobId, detail) => {
    try { await supabase.from('admin_logs').insert({ admin_name: adminName, action, job_id: jobId || '', detail: detail || '' }); await refreshLogs(); } catch(e) { console.log('log error:', e); }
  }, [refreshLogs]);

  const markRedoSeen = useCallback(async (id) => {
    const { error } = await supabase.from('jobs').update({ redo_seen: true }).eq('id', id);
    if (!error) await refreshJobs();
  }, [refreshJobs]);

  const uploadBatch = useCallback(async (batchId, items, warehouseId) => {
    await supabase.from('inventory').delete().eq('batch_id', batchId);
    const rows = items.map(i => ({
      product: i.product, size: i.size, color: i.color,
      imei: i.imei, serial: i.serial, grade: i.grade,
      batch_id: batchId, condition_remark: i.conditionRemark || '',
      code_id: i.codeId || '', model_no: i.modelNo || '', batch_remark: i.batchRemark || '',
      warehouse_id: warehouseId || null,
    }));
    const { error } = await supabase.from('inventory').insert(rows);
    if (!error) await refreshInv();
  }, [refreshInv]);

  const transferWarehouse = useCallback(async (dbIds, newWarehouseId) => {
    for (const dbId of dbIds) {
      await supabase.from('inventory').update({ warehouse_id: newWarehouseId }).eq('id', dbId);
    }
    await refreshInv();
  }, [refreshInv]);

  const deleteBatch = useCallback(async (batchId) => {
    const { error } = await supabase.from('inventory').delete().eq('batch_id', batchId);
    if (!error) await refreshInv();
  }, [refreshInv]);

  const updateInventoryRemark = useCallback(async (imei, serial, remark) => {
    if (imei) {
      await supabase.from('inventory').update({ condition_remark: remark }).eq('imei', imei);
    } else if (serial) {
      await supabase.from('inventory').update({ condition_remark: remark }).ilike('serial', serial);
    }
    await refreshInv();
  }, [refreshInv]);

  const nextTechId = useCallback(() => {
    const nums = techs.map(t => { const m = t.id.match(/\d+/); return m ? parseInt(m[0]) : 0; });
    return `TECH${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`;
  }, [techs]);

  const addTech = useCallback(async (tech) => {
    const { error } = await supabase.from('technicians').insert({
      id: tech.id.toUpperCase(), name: tech.name, password: tech.password, role: tech.role || 'tech',
    });
    if (!error) await refreshTechs();
  }, [refreshTechs]);

  const removeTech = useCallback(async (id) => {
    const { error } = await supabase.from('technicians').delete().eq('id', id);
    if (!error) await refreshTechs();
  }, [refreshTechs]);

  const updateTechSenior = useCallback(async (id, senior) => {
    const { error } = await supabase.from('technicians').update({ senior }).eq('id', id);
    if (!error) await refreshTechs();
  }, [refreshTechs]);

  const updateTechPassword = useCallback(async (id, newPw) => {
    const { error } = await supabase.from('technicians').update({ password: newPw }).eq('id', id);
    if (!error) await refreshTechs();
  }, [refreshTechs]);

  const updateTechName = useCallback(async (id, newName) => {
    const { error } = await supabase.from('technicians').update({ name: newName }).eq('id', id);
    if (!error) await refreshTechs();
  }, [refreshTechs]);

  const addSubJob = useCallback(async (sj) => {
    const { error } = await supabase.from('sub_jobs').insert({
      name: sj.name, cn: sj.cn || '', options: sj.options || [], tab: sj.tab || 'repair',
    });
    if (!error) await refreshSJ();
  }, [refreshSJ]);

  const updateSubJob = useCallback(async (index, sj) => {
    const existing = subJobs[index];
    if (!existing?._dbId) return;
    const { error } = await supabase.from('sub_jobs').update({
      name: sj.name, cn: sj.cn || '', options: sj.options || [], tab: sj.tab || 'repair',
    }).eq('id', existing._dbId);
    if (!error) await refreshSJ();
  }, [subJobs, refreshSJ]);

  const removeSubJob = useCallback(async (index) => {
    const existing = subJobs[index];
    if (!existing?._dbId) return;
    const { error } = await supabase.from('sub_jobs').delete().eq('id', existing._dbId);
    if (!error) await refreshSJ();
  }, [subJobs, refreshSJ]);

  const swapSubJobs = useCallback(async (i, j) => {
    const a = subJobs[i], b = subJobs[j];
    if (!a?._dbId || !b?._dbId) return;
    await Promise.all([
      supabase.from('sub_jobs').update({ name: b.name, cn: b.cn, options: b.options, tab: b.tab }).eq('id', a._dbId),
      supabase.from('sub_jobs').update({ name: a.name, cn: a.cn, options: a.options, tab: a.tab }).eq('id', b._dbId),
    ]);
    await refreshSJ();
  }, [subJobs, refreshSJ]);

  const refreshRH = useCallback(async () => {
    try { const { data } = await supabase.from('repair_houses').select('*').order('name'); if (data) setRepairHouses(data); } catch(e) { console.log('repair_houses error:', e); }
  }, []);

  const addRepairHouse = useCallback(async (rh) => {
    const { error } = await supabase.from('repair_houses').insert({ name: rh.name, contact: rh.contact || '', address: rh.address || '', notes: rh.notes || '' });
    if (!error) await refreshRH();
  }, [refreshRH]);

  const updateRepairHouse = useCallback(async (id, rh) => {
    const { error } = await supabase.from('repair_houses').update({ name: rh.name, contact: rh.contact || '', address: rh.address || '', notes: rh.notes || '' }).eq('id', id);
    if (!error) await refreshRH();
  }, [refreshRH]);

  const removeRepairHouse = useCallback(async (id) => {
    const { error } = await supabase.from('repair_houses').delete().eq('id', id);
    if (!error) await refreshRH();
  }, [refreshRH]);

  const refreshRC = useCallback(async () => {
    try { const { data } = await supabase.from('remark_codes').select('*').order('code'); if (data) setRemarkCodes(data); } catch(e) {}
  }, []);

  const addRemarkCode = useCallback(async (rc) => {
    const { error } = await supabase.from('remark_codes').insert({ code: rc.code, meaning_en: rc.meaning_en, meaning_cn: rc.meaning_cn || '' });
    if (!error) await refreshRC();
  }, [refreshRC]);

  const updateRemarkCode = useCallback(async (id, rc) => {
    const { error } = await supabase.from('remark_codes').update({ code: rc.code, meaning_en: rc.meaning_en, meaning_cn: rc.meaning_cn || '' }).eq('id', id);
    if (!error) await refreshRC();
  }, [refreshRC]);

  const removeRemarkCode = useCallback(async (id) => {
    const { error } = await supabase.from('remark_codes').delete().eq('id', id);
    if (!error) await refreshRC();
  }, [refreshRC]);

  const updateInvStatus = useCallback(async (dbId, fields) => {
    const updates = {};
    if (fields.glassStatus !== undefined) updates.glass_status = fields.glassStatus;
    if (fields.cameraStatus !== undefined) updates.camera_status = fields.cameraStatus;
    if (fields.cameraDetail !== undefined) updates.camera_detail = fields.cameraDetail;
    if (fields.lcdFault !== undefined || fields.lcdFaults !== undefined || fields.lcdFaultsRemark !== undefined || fields.housingStatus !== undefined || fields.stepLog || fields.redoHistory !== undefined || fields.glassShadow !== undefined || fields.glassShadowRemark !== undefined || fields.hsServicing !== undefined || fields.hsServicingRemark !== undefined || fields.hsUnfixable !== undefined || fields.techQc !== undefined || fields.techQcRemark !== undefined || fields.hsParts !== undefined || fields.hsPartsRemark !== undefined || fields.partsUsed !== undefined || fields.glassServicing !== undefined || fields.icmIssues !== undefined || fields.glassAutoSkip !== undefined || fields.cameraAutoSkip !== undefined) {
      const { data: cur } = await supabase.from('inventory').select('camera_detail').eq('id', dbId).single();
      const detail = { ...(cur?.camera_detail || {}), ...(updates.camera_detail || {}) };
      if (fields.lcdFault !== undefined) detail.lcdFault = fields.lcdFault;
      if (fields.housingStatus !== undefined) detail.housingStatus = fields.housingStatus;
      if (fields.cameraDetail?.housingSteps !== undefined) detail.housingSteps = fields.cameraDetail.housingSteps;
      if (fields.stepLog) detail.stepLog = [...(detail.stepLog || []), ...fields.stepLog];
      if (fields.redoHistory !== undefined) detail.redoHistory = fields.redoHistory;
      if (fields.lcdFaults !== undefined) detail.lcdFaults = fields.lcdFaults;
      if (fields.lcdFaultsRemark !== undefined) detail.lcdFaultsRemark = fields.lcdFaultsRemark;
      if (fields.glassShadow !== undefined) detail.glassShadow = fields.glassShadow;
      if (fields.glassShadowRemark !== undefined) detail.glassShadowRemark = fields.glassShadowRemark;
      if (fields.hsServicing !== undefined) detail.hsServicing = fields.hsServicing;
      if (fields.hsServicingRemark !== undefined) detail.hsServicingRemark = fields.hsServicingRemark;
      if (fields.hsUnfixable !== undefined) detail.hsUnfixable = fields.hsUnfixable;
      if (fields.techQc !== undefined) detail.techQc = fields.techQc;
      if (fields.techQcRemark !== undefined) detail.techQcRemark = fields.techQcRemark;
      if (fields.hsParts !== undefined) detail.hsParts = fields.hsParts;
      if (fields.hsPartsRemark !== undefined) detail.hsPartsRemark = fields.hsPartsRemark;
      if (fields.partsUsed !== undefined) detail.partsUsed = fields.partsUsed;
      if (fields.glassServicing !== undefined) detail.glassServicing = fields.glassServicing;
      if (fields.icmIssues !== undefined) detail.icmIssues = fields.icmIssues;
      if (fields.glassAutoSkip !== undefined) detail.glassAutoSkip = fields.glassAutoSkip;
      if (fields.cameraAutoSkip !== undefined) detail.cameraAutoSkip = fields.cameraAutoSkip;
      updates.camera_detail = detail;
    }
    const { error } = await supabase.from('inventory').update(updates).eq('id', dbId);
    if (!error) await refreshInv();
  }, [refreshInv]);

  const bulkUpdateInvStatus = useCallback(async (updates) => {
    for (const u of updates) {
      const fields = {};
      if (u.glassStatus !== undefined) fields.glass_status = u.glassStatus;
      if (u.cameraStatus !== undefined) fields.camera_status = u.cameraStatus;
      if (u.cameraDetail !== undefined) fields.camera_detail = u.cameraDetail;
      if (u.housingStatus !== undefined || u.stepLog) {
        const { data: cur } = await supabase.from('inventory').select('camera_detail').eq('id', u.dbId).single();
        const detail = { ...(cur?.camera_detail || {}), ...(fields.camera_detail || {}) };
        if (u.housingStatus !== undefined) detail.housingStatus = u.housingStatus;
        if (u.stepLog) detail.stepLog = [...(detail.stepLog || []), ...u.stepLog];
        fields.camera_detail = detail;
      }
      await supabase.from('inventory').update(fields).eq('id', u.dbId);
    }
    await refreshInv();
  }, [refreshInv]);

  const bulkCreateJobs = useCallback(async (jobsData) => {
    const now = new Date().toISOString();
    const rows = jobsData.map(j => jobToDB({ ...j, id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9), dateIn: now, dateDone: now }));
    const { error } = await supabase.from('jobs').insert(rows);
    if (!error) await refreshJobs();
  }, [refreshJobs]);

  const refreshFB = useCallback(async () => {
    try { const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(100); if (data) setFeedback(data); } catch(e) {}
  }, []);

  const uploadFeedbackFile = useCallback(async (file) => {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}_${Math.random().toString(36).substr(2,6)}.${ext}`;
    const { error } = await supabase.storage.from('feedback-files').upload(name, file);
    if (error) { console.error('Upload error:', error); return null; }
    const { data } = supabase.storage.from('feedback-files').getPublicUrl(name);
    return data?.publicUrl || null;
  }, []);
  const deleteFeedbackFile = useCallback(async (feedbackId, fileUrl) => {
    if (fileUrl) {
      const fileName = fileUrl.split('/').pop();
      await supabase.storage.from('feedback-files').remove([fileName]);
    }
    await supabase.from('feedback').update({ file_url: '' }).eq('id', feedbackId);
    await refreshFB();
  }, [refreshFB]);
  const submitFeedback = useCallback(async (userId, userName, type, message, fileUrl) => {
    const row = { user_id: userId, user_name: userName, type, message };
    if (fileUrl) row.file_url = fileUrl;
    const { error } = await supabase.from('feedback').insert(row);
    if (!error) await refreshFB();
    return !error;
  }, [refreshFB]);

  const updateFeedbackStatus = useCallback(async (id, status) => {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (!error) await refreshFB();
  }, [refreshFB]);

  const refreshComm = useCallback(async () => {
    try { const { data } = await supabase.from('commission_rates').select('*').order('section,step'); if (data) setCommRates(data); } catch(e) {}
  }, []);
  const addCommRate = useCallback(async (rate) => {
    const { error } = await supabase.from('commission_rates').insert(rate);
    if (!error) await refreshComm();
  }, [refreshComm]);
  const updateCommRate = useCallback(async (id, fields) => {
    const { error } = await supabase.from('commission_rates').update(fields).eq('id', id);
    if (!error) await refreshComm();
  }, [refreshComm]);
  const removeCommRate = useCallback(async (id) => {
    const { error } = await supabase.from('commission_rates').delete().eq('id', id);
    if (!error) await refreshComm();
  }, [refreshComm]);

  const refreshParts = useCallback(async () => {
    try { const { data } = await supabase.from('parts_inventory').select('*').eq('active', true).order('category,name'); if (data) setPartsInv(data); } catch(e) {}
  }, []);
  const addPart = useCallback(async (part) => {
    const { error } = await supabase.from('parts_inventory').insert(part);
    if (!error) await refreshParts();
  }, [refreshParts]);
  const updatePart = useCallback(async (id, fields) => {
    const { error } = await supabase.from('parts_inventory').update(fields).eq('id', id);
    if (!error) await refreshParts();
  }, [refreshParts]);
  const removePart = useCallback(async (id) => {
    const { error } = await supabase.from('parts_inventory').update({ active: false }).eq('id', id);
    if (!error) await refreshParts();
  }, [refreshParts]);
  const usePart = useCallback(async (id, qty) => {
    const { data: cur } = await supabase.from('parts_inventory').select('qty').eq('id', id).single();
    if (!cur) return;
    const newQty = Math.max(0, (cur.qty || 0) - qty);
    const { error } = await supabase.from('parts_inventory').update({ qty: newQty }).eq('id', id);
    if (!error) await refreshParts();
  }, [refreshParts]);
  const restockPart = useCallback(async (id, qty) => {
    const { data: cur } = await supabase.from('parts_inventory').select('qty').eq('id', id).single();
    if (!cur) return;
    const newQty = (cur.qty || 0) + qty;
    const { error } = await supabase.from('parts_inventory').update({ qty: newQty }).eq('id', id);
    if (!error) await refreshParts();
  }, [refreshParts]);

  const refreshChat = useCallback(async () => {
    try { const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(200); if (data) setChatMsgs(data); } catch(e) {}
  }, []);
  const sendChat = useCallback(async (userId, userName, message, unitRef) => {
    const { error } = await supabase.from('chat_messages').insert({ user_id: userId, user_name: userName, message, unit_ref: unitRef || '', pinned: false });
    if (!error) await refreshChat();
  }, [refreshChat]);
  const pinChat = useCallback(async (id, pinned) => {
    const { error } = await supabase.from('chat_messages').update({ pinned }).eq('id', id);
    if (!error) await refreshChat();
  }, [refreshChat]);
  const deleteChat = useCallback(async (id) => {
    const { error } = await supabase.from('chat_messages').delete().eq('id', id);
    if (!error) await refreshChat();
  }, [refreshChat]);

  const refreshNotifs = useCallback(async () => {
    try { const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100); if (data) setNotifs(data); } catch(e) {}
  }, []);
  const addNotif = useCallback(async (userId, type, title, detail) => {
    const { error } = await supabase.from('notifications').insert({ user_id: userId, type, title, detail, seen: false });
    if (!error) await refreshNotifs();
  }, [refreshNotifs]);
  const markNotifSeen = useCallback(async (id) => {
    const { error } = await supabase.from('notifications').update({ seen: true }).eq('id', id);
    if (!error) await refreshNotifs();
  }, [refreshNotifs]);
  const markAllNotifSeen = useCallback(async (userId) => {
    const { error } = await supabase.from('notifications').update({ seen: true }).eq('user_id', userId);
    if (!error) {
      const { error: e2 } = await supabase.from('notifications').update({ seen: true }).eq('user_id', 'all');
      await refreshNotifs();
    }
  }, [refreshNotifs]);

  const getFreshInv = useCallback(async (dbId) => {
    const { data } = await supabase.from('inventory').select('*').eq('id', dbId).single();
    return data;
  }, []);

  // ── Buyers ──
  const refreshBuyers = useCallback(async () => {
    try { const { data } = await supabase.from('buyers').select('*').eq('active', true).order('name'); if (data) setBuyers(data); } catch(e) {}
  }, []);
  const addBuyer = useCallback(async (buyer) => {
    const { error } = await supabase.from('buyers').insert({ name: buyer.name, contact: buyer.contact || '', address: buyer.address || '', terms: buyer.terms || '', notes: buyer.notes || '', active: true });
    if (!error) await refreshBuyers();
  }, [refreshBuyers]);
  const updateBuyer = useCallback(async (id, fields) => {
    const { error } = await supabase.from('buyers').update(fields).eq('id', id);
    if (!error) await refreshBuyers();
  }, [refreshBuyers]);
  const removeBuyer = useCallback(async (id) => {
    const { error } = await supabase.from('buyers').update({ active: false }).eq('id', id);
    if (!error) await refreshBuyers();
  }, [refreshBuyers]);

  // ── Buyer Orders ──
  const refreshOrders = useCallback(async () => {
    try { const { data } = await supabase.from('buyer_orders').select('*').order('created_at', { ascending: false }); if (data) setBuyerOrders(data); } catch(e) {}
  }, []);
  const addOrder = useCallback(async (order) => {
    const { error } = await supabase.from('buyer_orders').insert(order);
    if (!error) await refreshOrders();
  }, [refreshOrders]);
  const updateOrder = useCallback(async (id, fields) => {
    const { error } = await supabase.from('buyer_orders').update(fields).eq('id', id);
    if (!error) await refreshOrders();
  }, [refreshOrders]);
  const deleteOrder = useCallback(async (id) => {
    const { error } = await supabase.from('buyer_orders').delete().eq('id', id);
    if (!error) await refreshOrders();
  }, [refreshOrders]);

  // ── Order Items ──
  const refreshOrderItems = useCallback(async () => {
    try { const { data } = await supabase.from('order_items').select('*').order('id'); if (data) setOrderItems(data); } catch(e) {}
  }, []);
  const addOrderItem = useCallback(async (item) => {
    const { error } = await supabase.from('order_items').insert(item);
    if (!error) await refreshOrderItems();
  }, [refreshOrderItems]);
  const bulkAddOrderItems = useCallback(async (items) => {
    const { error } = await supabase.from('order_items').insert(items);
    if (!error) await refreshOrderItems();
  }, [refreshOrderItems]);
  const removeOrderItem = useCallback(async (id) => {
    const { error } = await supabase.from('order_items').delete().eq('id', id);
    if (!error) await refreshOrderItems();
  }, [refreshOrderItems]);
  const updateOrderItem = useCallback(async (id, fields) => {
    const { error } = await supabase.from('order_items').update(fields).eq('id', id);
    if (!error) await refreshOrderItems();
  }, [refreshOrderItems]);
  const markItemDelivered = useCallback(async (id) => {
    const { error } = await supabase.from('order_items').update({ delivered: true, delivered_at: new Date().toISOString() }).eq('id', id);
    if (!error) await refreshOrderItems();
  }, [refreshOrderItems]);

  // ── Stock Movements ──
  const addStockMovement = useCallback(async (movement) => {
    const { error } = await supabase.from('stock_movements').insert(movement);
    if (error) console.error('addStockMovement error:', error);
  }, []);

  const db = useMemo(() => ({
    login, logout, createJob, updateJob, setJobStatus, deleteJob, markRedoSeen,
    uploadBatch, deleteBatch, updateInventoryRemark, transferWarehouse,
    nextTechId, addTech, removeTech, updateTechPassword, updateTechName, updateTechSenior,
    addSubJob, updateSubJob, removeSubJob, swapSubJobs,
    addRepairHouse, updateRepairHouse, removeRepairHouse,
    restoreJob, logAdminAction,
    addRemarkCode, updateRemarkCode, removeRemarkCode,
    updateInvStatus, bulkUpdateInvStatus, bulkCreateJobs,
    submitFeedback, updateFeedbackStatus, uploadFeedbackFile, deleteFeedbackFile, refreshAll,
    addCommRate, updateCommRate, removeCommRate,
    addPart, updatePart, removePart, usePart, restockPart, refreshParts,
    sendChat, pinChat, deleteChat, refreshChat,
    addNotif, markNotifSeen, markAllNotifSeen, refreshNotifs, getFreshInv,
    addBuyer, updateBuyer, removeBuyer, refreshBuyers,
    addOrder, updateOrder, deleteOrder, refreshOrders,
    addOrderItem, bulkAddOrderItems, removeOrderItem, updateOrderItem, markItemDelivered, refreshOrderItems,
    addStockMovement,
  }), [login, logout, createJob, updateJob, setJobStatus, deleteJob, markRedoSeen, uploadBatch, deleteBatch, updateInventoryRemark, transferWarehouse, nextTechId, addTech, removeTech, updateTechPassword, updateTechName, updateTechSenior, addSubJob, updateSubJob, removeSubJob, swapSubJobs, addRepairHouse, updateRepairHouse, removeRepairHouse, restoreJob, logAdminAction, addRemarkCode, updateRemarkCode, removeRemarkCode, updateInvStatus, bulkUpdateInvStatus, bulkCreateJobs, submitFeedback, updateFeedbackStatus, uploadFeedbackFile, deleteFeedbackFile, refreshAll, addCommRate, updateCommRate, removeCommRate, addPart, updatePart, removePart, usePart, restockPart, refreshParts, sendChat, pinChat, deleteChat, refreshChat, addNotif, markNotifSeen, markAllNotifSeen, refreshNotifs, getFreshInv, addBuyer, updateBuyer, removeBuyer, refreshBuyers, addOrder, updateOrder, deleteOrder, refreshOrders, addOrderItem, bulkAddOrderItems, removeOrderItem, updateOrderItem, markItemDelivered, refreshOrderItems, addStockMovement]);

  return { user, techs, jobs, subJobs, inv, repairHouses, adminLogs, remarkCodes, feedback, commRates, partsInv, chatMsgs, notifs, buyers, buyerOrders, orderItems, db, loading };
}
