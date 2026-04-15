import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signUp({ email, password, prenom, niveau }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { prenom, niveau: niveau || null } },
  })
  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateUserPlan(userId, plan) {
  const { error } = await supabase
    .from('users')
    .update({ plan })
    .eq('id', userId)
  if (error) throw error
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...profileData, updated_at: new Date().toISOString() }, {
      onConflict: 'user_id',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function createSession(userId, planUsed) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: userId, plan_used: planUsed })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function endSession(sessionId, { dureeMinutes, matieres, resume }) {
  const { error } = await supabase
    .from('sessions')
    .update({
      ended_at: new Date().toISOString(),
      duree_minutes: dureeMinutes,
      matieres,
      resume,
    })
    .eq('id', sessionId)
  if (error) throw error
}

export async function getUserSessions(userId, limit = 20) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getLastSession(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function saveMessage(sessionId, role, content) {
  const { error } = await supabase
    .from('messages')
    .insert({ session_id: sessionId, role, content })
  if (error) throw error
}

export async function getSessionMessages(sessionId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// ─── Victories ───────────────────────────────────────────────────────────────

export async function addVictory(userId, sessionId, texte) {
  const { data, error } = await supabase
    .from('victories')
    .insert({ user_id: userId, session_id: sessionId, texte })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getUserVictories(userId, limit = 50) {
  const { data, error } = await supabase
    .from('victories')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// ─── Parent links ────────────────────────────────────────────────────────────

export async function linkParentToChild(parentId, childEmail) {
  const { data: childUser, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('email', childEmail)
    .single()
  if (findError) throw new Error('Aucun élève trouvé avec cet email.')

  const { error } = await supabase
    .from('parent_links')
    .insert({ parent_id: parentId, child_id: childUser.id })
  if (error && error.code !== '23505') throw error
  return childUser
}

export async function getLinkedChildren(parentId) {
  const { data, error } = await supabase
    .from('parent_links')
    .select('child_id, users!parent_links_child_id_fkey(prenom, email, plan)')
    .eq('parent_id', parentId)
  if (error) throw error
  return data
}

export async function getChildStats(childId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: sessions, error: sErr } = await supabase
    .from('sessions')
    .select('id, started_at, duree_minutes, matieres')
    .eq('user_id', childId)
    .gte('started_at', sevenDaysAgo)
    .order('started_at', { ascending: false })
  if (sErr) throw sErr

  const { data: victories, error: vErr } = await supabase
    .from('victories')
    .select('*')
    .eq('user_id', childId)
    .order('date', { ascending: false })
    .limit(20)
  if (vErr) throw vErr

  return { sessions, victories }
}
