import { supabase } from '../supabase/client.js'

export const AuthService = {
  async getSession() {
    if (!supabase) throw new Error('Falta configurar Supabase.')
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async signInWithEmail(email) {
    if (!supabase) throw new Error('Falta configurar Supabase.')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: false }
    })
    if (error) throw error
  },

  async signOut() {
    if (!supabase) throw new Error('Falta configurar Supabase.')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  onChange(callback) {
    if (!supabase) return () => {}
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
    return () => data.subscription.unsubscribe()
  }
}
